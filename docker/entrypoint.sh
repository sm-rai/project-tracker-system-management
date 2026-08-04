#!/bin/sh
set -eu

cd /var/www/html

prepare_laravel_directories() {
    mkdir -p \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache

    chown -R www-data:www-data storage bootstrap/cache
}

case "${1:-app}" in
    app)
        prepare_laravel_directories
        gosu www-data php artisan storage:link --force --no-interaction
        gosu www-data php artisan migrate --force --no-interaction
        gosu www-data php artisan optimize

        exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
        ;;
    worker)
        prepare_laravel_directories

        exec gosu www-data php artisan queue:work \
            --sleep=3 \
            --tries=3 \
            --timeout=90 \
            --max-time=3600
        ;;
    *)
        exec "$@"
        ;;
esac


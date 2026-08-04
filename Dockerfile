FROM php:8.3-fpm-bookworm AS php-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        intl \
        opcache \
        pcntl \
        pdo_mysql \
        zip \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php/production.ini /usr/local/etc/php/conf.d/production.ini

FROM node:22-bookworm-slim AS node-runtime

FROM php-base AS build

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=node-runtime /usr/local/ /usr/local/

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN composer dump-autoload --no-dev --classmap-authoritative --no-interaction \
    && npm run build \
    && npm prune --omit=dev \
    && rm -rf storage/logs/* storage/framework/cache/* storage/framework/sessions/* storage/framework/views/*

FROM php-base AS production

ENV APP_ENV=production \
    APP_DEBUG=false \
    BROWSERSHOT_CHROME_PATH=/usr/bin/chromium \
    BROWSERSHOT_NODE_BINARY=/usr/local/bin/node \
    BROWSERSHOT_NPM_BINARY=/usr/local/bin/npm \
    LOG_CHANNEL=stderr \
    PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        curl \
        fonts-liberation \
        fonts-noto-color-emoji \
        gosu \
        nginx \
        supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=node-runtime /usr/local/ /usr/local/
COPY --chown=www-data:www-data --from=build /app /var/www/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisor/app.conf /etc/supervisor/conf.d/app.conf
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint

RUN chmod +x /usr/local/bin/docker-entrypoint \
    && mkdir -p /run/nginx /var/log/supervisor \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

WORKDIR /var/www/html

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint"]
CMD ["app"]

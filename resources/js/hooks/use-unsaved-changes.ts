import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export function useUnsavedChanges(
    isDirty: boolean,
    message = 'Perubahan belum disimpan. Tetap tinggalkan halaman?',
) {
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        const removeInertiaGuard = router.on('before', (event) => {
            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            if (!window.confirm(message)) {
                event.preventDefault();
            }
        });

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            removeInertiaGuard();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty, message]);

    return {
        markSubmitting: () => {
            isSubmittingRef.current = true;
        },
        markFinished: () => {
            isSubmittingRef.current = false;
        },
    };
}

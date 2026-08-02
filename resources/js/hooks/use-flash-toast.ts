import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export interface FlashToastData {
    success?: string | null;
    error?: string | null;
}

function showFlashToast(flash?: FlashToastData): void {
    if (flash?.success) {
        toast.success(flash.success);
    }

    if (flash?.error) {
        toast.error(flash.error);
    }
}

export function useFlashToast(initialFlash?: FlashToastData) {
    const initialSuccess = initialFlash?.success;
    const initialError = initialFlash?.error;

    useEffect(() => {
        showFlashToast({
            success: initialSuccess,
            error: initialError,
        });

        return router.on('flash', (event) => {
            showFlashToast(event.detail.flash as FlashToastData);
        });
    }, [initialError, initialSuccess]);
}

export function FlashToastListener({
    initialFlash,
}: {
    initialFlash?: FlashToastData;
}) {
    useFlashToast(initialFlash);

    return null;
}

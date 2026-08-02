import type { GlobalEvent, VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { createElement, useEffect, useRef, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';

type PendingVisit = GlobalEvent<'before'>['detail']['visit'];

function getReplayVisitOptions(pendingVisit: PendingVisit): {
    url: URL;
    options: VisitOptions;
} {
    const { url, ...visitOptions } = pendingVisit;
    const options = visitOptions as unknown as VisitOptions;
    const optionsRecord = options as Record<string, unknown>;

    delete optionsRecord.id;
    delete optionsRecord.completed;
    delete optionsRecord.cancelled;
    delete optionsRecord.interrupted;

    return { url, options };
}

type UnsavedChangesDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    message: string;
};

function UnsavedChangesDialog({
    open,
    onOpenChange,
    onConfirm,
    message,
}: UnsavedChangesDialogProps) {
    return createElement(ConfirmDialog, {
        open,
        onOpenChange,
        title: 'Tinggalkan halaman?',
        description: message,
        confirmText: 'Tinggalkan halaman',
        cancelText: 'Tetap di halaman',
        variant: 'warning',
        onConfirm,
    });
}

export function useUnsavedChanges(
    isDirty: boolean,
    message = 'Perubahan belum disimpan. Tetap tinggalkan halaman?',
) {
    const isSubmittingRef = useRef(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingVisit, setPendingVisit] = useState<PendingVisit | null>(null);
    const [replayVisit, setReplayVisit] = useState<PendingVisit | null>(null);

    useEffect(() => {
        const removeInertiaGuard = router.on('before', (event) => {
            if (replayVisit) {
                return;
            }

            if (!isDirty || isSubmittingRef.current) {
                return;
            }

            event.preventDefault();
            setPendingVisit(event.detail.visit);
            setConfirmOpen(true);
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
    }, [isDirty, message, replayVisit]);

    useEffect(() => {
        if (!replayVisit) {
            return;
        }

        const { url, options } = getReplayVisitOptions(replayVisit);

        router.visit(url, {
            ...options,
            onFinish: () => setReplayVisit(null),
        });
    }, [replayVisit]);

    const handleDialogChange = (open: boolean) => {
        setConfirmOpen(open);

        if (!open) {
            setPendingVisit(null);
        }
    };

    const confirmNavigation = () => {
        if (!pendingVisit) {
            setConfirmOpen(false);

            return;
        }

        setPendingVisit(null);
        setConfirmOpen(false);
        setReplayVisit(pendingVisit);
    };

    return {
        markSubmitting: () => {
            isSubmittingRef.current = true;
        },
        markFinished: () => {
            isSubmittingRef.current = false;
        },
        unsavedChangesDialog: createElement(UnsavedChangesDialog, {
            open: confirmOpen,
            onOpenChange: handleDialogChange,
            onConfirm: confirmNavigation,
            message,
        }),
    };
}

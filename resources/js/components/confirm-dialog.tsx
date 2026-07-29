import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconTrash } from '@tabler/icons-react';

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Lanjutkan',
    cancelText = 'Batal',
    variant = 'warning',
    onConfirm,
}: ConfirmDialogProps) {
    const renderIcon = () => {
        switch (variant) {
            case 'danger':
                return (
                    <div className="flex size-14 items-center justify-center rounded-full bg-danger-surface text-danger shadow-xs">
                        <IconTrash className="size-7" />
                    </div>
                );
            case 'warning':
                return (
                    <div className="flex size-14 items-center justify-center rounded-full bg-warning-surface text-warning shadow-xs">
                        <IconAlertTriangle className="size-7" />
                    </div>
                );
            case 'success':
                return (
                    <div className="flex size-14 items-center justify-center rounded-full bg-success-surface text-success shadow-xs">
                        <IconCheck className="size-7" />
                    </div>
                );
            case 'info':
            default:
                return (
                    <div className="flex size-14 items-center justify-center rounded-full bg-info-surface text-info shadow-xs">
                        <IconInfoCircle className="size-7" />
                    </div>
                );
        }
    };

    const getButtonCustomClass = () => {
        switch (variant) {
            case 'danger':
                return ''; // Handled by variant="destructive"
            case 'warning':
                return 'bg-warning text-warning-foreground hover:bg-warning/90';
            case 'success':
                return 'bg-success text-success-foreground hover:bg-success/90';
            case 'info':
            default:
                return 'bg-primary text-primary-foreground hover:bg-primary-hover';
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent size="sm" className="sm:max-w-md text-center">
                <AlertDialogHeader className="flex flex-col items-center justify-center text-center gap-3 pt-2">
                    {renderIcon()}
                    <div className="space-y-1.5 text-center">
                        <AlertDialogTitle className="text-base font-semibold tracking-tight text-foreground">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
                            {description}
                        </AlertDialogDescription>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 flex flex-row items-center justify-center gap-2 sm:justify-center">
                    <AlertDialogCancel variant="outline" className="h-9 px-4 text-xs font-medium">
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        className={`h-9 px-4 text-xs font-medium ${getButtonCustomClass()}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

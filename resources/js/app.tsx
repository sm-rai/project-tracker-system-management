import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import { FlashToastListener } from '@/hooks/use-flash-toast';

const appName = import.meta.env.VITE_APP_NAME || 'Project Tracker';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob<ResolvedComponent>('./pages/**/*.tsx');

        return pages[`./pages/${name}.tsx`]();
    },
    setup({ el, App, props }) {
        if (!el) {
            return;
        }

        createRoot(el).render(
            <>
                <App {...props} />
                <FlashToastListener initialFlash={props.initialPage.flash} />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '10px 16px',
                            boxShadow:
                                '0 4px 16px color-mix(in srgb, var(--foreground) 8%, transparent)',
                        },
                        success: {
                            iconTheme: {
                                primary: 'var(--success)',
                                secondary: 'var(--success-foreground)',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: 'var(--danger)',
                                secondary: 'var(--danger-foreground)',
                            },
                        },
                    }}
                />
            </>,
        );
    },
    progress: {
        color: 'var(--primary)',
    },
});

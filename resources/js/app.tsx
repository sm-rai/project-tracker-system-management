import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

const appName = import.meta.env.VITE_APP_NAME || 'Project Tracker';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true }) as Record<
            string,
            { default: React.ComponentType }
        >;
        return pages[`./pages/${name}.tsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#FFFFFF',
                            color: '#25211E',
                            border: '1px solid #E7DFD5',
                            fontSize: '13px',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '10px 16px',
                            boxShadow: '0 4px 16px rgba(37, 33, 30, 0.08)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#3F7A4A',
                                secondary: '#FFFFFF',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#DC2626',
                                secondary: '#FFFFFF',
                            },
                        },
                    }}
                />
            </>,
        );
    },
    progress: {
        color: '#AF4424',
    },
});

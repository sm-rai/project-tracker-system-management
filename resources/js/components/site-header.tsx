import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface SiteHeaderProps {
    title?: string;
}

export function SiteHeader({ title = 'Dashboard' }: SiteHeaderProps) {
    return (
        <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-card/80 backdrop-blur-md transition-[width,height] ease-linear md:rounded-t-xl group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1 className="text-sm font-semibold tracking-tight md:text-base">
                    {title}
                </h1>
            </div>
        </header>
    );
}

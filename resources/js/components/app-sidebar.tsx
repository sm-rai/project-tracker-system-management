import { Link, usePage } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconBulb,
    IconClock,
    IconDashboard,
    IconFileAnalytics,
    IconFolderCode,
    IconUserShield,
    IconUsers,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import * as React from 'react';

import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { index as featureRequestsIndex } from '@/routes/feature-requests';
import type { User } from '@/types/auth';

const menuItemClassName =
    'h-9 transition-colors hover:bg-background-soft data-[active=true]:bg-primary-surface data-[active=true]:font-semibold data-[active=true]:text-primary focus-visible:ring-2 focus-visible:ring-primary/30';

interface NavigationItem {
    label: string;
    href: React.ComponentProps<typeof Link>['href'];
    icon: TablerIcon;
    isActive: (url: string) => boolean;
}

interface NavigationSection {
    label: string;
    items: NavigationItem[];
}

function NavigationMenuItem({
    item,
    url,
}: {
    item: NavigationItem;
    url: string;
}) {
    const Icon = item.icon;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={item.isActive(url)}
                tooltip={item.label}
                className={menuItemClassName}
            >
                <Link href={item.href} className="flex items-center gap-2.5">
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { props: pageProps, url } = usePage<{ auth: { user: User } }>();
    const user = pageProps.auth?.user || {
        name: 'User',
        email: 'user@example.com',
        role: 'user',
    };

    const isAdmin = user.role === 'admin';

    const navigationSections: NavigationSection[] = [
        {
            label: 'Ringkasan',
            items: [
                {
                    label: 'Dashboard',
                    href: '/dashboard',
                    icon: IconDashboard,
                    isActive: (currentUrl) =>
                        currentUrl === '/' || currentUrl === '/dashboard',
                },
            ],
        },
        {
            label: 'Pengelolaan',
            items: [
                {
                    label: 'Project & Sistem',
                    href: '/projects',
                    icon: IconFolderCode,
                    isActive: (currentUrl) =>
                        currentUrl.startsWith('/projects'),
                },
                {
                    label: 'Issue',
                    href: '/issues',
                    icon: IconAlertTriangle,
                    isActive: (currentUrl) => currentUrl.startsWith('/issues'),
                },
                {
                    label: 'Feature Request',
                    href: featureRequestsIndex(),
                    icon: IconBulb,
                    isActive: (currentUrl) =>
                        currentUrl.startsWith('/feature-requests'),
                },
            ],
        },
        {
            label: 'Pelaporan',
            items: [
                {
                    label: 'Laporan OKR',
                    href: '/reports',
                    icon: IconFileAnalytics,
                    isActive: (currentUrl) => currentUrl.startsWith('/reports'),
                },
            ],
        },
        {
            label: 'Konfigurasi',
            items: [
                {
                    label: 'Pengaturan SLA',
                    href: '/settings/sla',
                    icon: IconClock,
                    isActive: (currentUrl) =>
                        currentUrl.startsWith('/settings/sla'),
                },
            ],
        },
    ];

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            className="h-auto min-h-16 p-2 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/30 active:bg-transparent [&>span:last-child]:overflow-visible [&>span:last-child]:text-clip [&>span:last-child]:whitespace-normal"
                        >
                            <Link
                                href="/dashboard"
                                className="flex min-w-0 items-center gap-3"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-surface p-2">
                                    <img
                                        src="/images/Logo RAI.png"
                                        alt="Logo Rumah Atsiri Indonesia"
                                        className="size-full object-contain"
                                    />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] leading-tight font-semibold tracking-[-0.01em] whitespace-nowrap">
                                        Project Tracker
                                    </span>
                                    <span className="mt-1 block text-xs leading-4 whitespace-nowrap text-muted-foreground">
                                        System Management
                                    </span>
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                {navigationSections.map((section) => (
                    <SidebarGroup key={section.label} className="px-0 py-1">
                        <SidebarGroupLabel className="h-7 px-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                            {section.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => (
                                    <NavigationMenuItem
                                        key={item.label}
                                        item={item}
                                        url={url}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                {isAdmin && (
                    <SidebarGroup className="border-t border-sidebar-border px-0 pt-3">
                        <SidebarGroupLabel className="h-7 gap-1.5 px-3 text-[10px] font-semibold tracking-[0.12em] text-primary uppercase">
                            <IconUserShield className="size-3.5" />
                            Administrasi
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <NavigationMenuItem
                                    item={{
                                        label: 'Manajemen User',
                                        href: '/users',
                                        icon: IconUsers,
                                        isActive: (currentUrl) =>
                                            currentUrl.startsWith('/users'),
                                    }}
                                    url={url}
                                />
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-2">
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    );
}

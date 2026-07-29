import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { IconDashboard, IconFolderCode, IconUsers, IconUserShield } from '@tabler/icons-react';

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
import type { User } from '@/types/auth';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { props: pageProps, url } = usePage<{ auth: { user: User } }>();
    const user = pageProps.auth?.user || {
        name: 'User',
        email: 'user@example.com',
        role: 'user',
    };

    const isAdmin = user.role === 'admin';

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader className="border-b px-4 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            className="hover:bg-transparent active:bg-transparent"
                        >
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3"
                            >
                                <img
                                    src="/images/Logo RAI Full.png"
                                    alt="Rumah Atsiri Indonesia"
                                    className="h-8 w-auto object-contain"
                                />
                                <div className="flex flex-col text-left leading-tight">
                                    <span className="text-sm font-bold tracking-tight">
                                        Project Tracker
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        System Management
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-2">
                {/* Navigasi Utama */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
                        Navigasi Utama
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        url === '/dashboard' || url === '/'
                                    }
                                    tooltip="Dashboard"
                                    className="transition-colors hover:bg-[#FAF7F2] data-[active=true]:bg-[#F3E3DE] data-[active=true]:font-semibold data-[active=true]:text-[#AF4424]"
                                >
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2.5"
                                    >
                                        <IconDashboard className="size-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/projects')}
                                    tooltip="Project & Sistem"
                                    className="transition-colors hover:bg-[#FAF7F2] data-[active=true]:bg-[#F3E3DE] data-[active=true]:font-semibold data-[active=true]:text-[#AF4424]"
                                >
                                    <Link
                                        href="/projects"
                                        className="flex items-center gap-2.5"
                                    >
                                        <IconFolderCode className="size-4" />
                                        <span>Project & Sistem</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Menu Admin (Kelola User) */}
                {isAdmin && (
                    <SidebarGroup className="mt-2">
                        <SidebarGroupLabel className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#AF4424] uppercase">
                            <IconUserShield className="size-3.5 text-[#AF4424]" />
                            <span>Admin System</span>
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith('/users')}
                                        tooltip="Kelola User"
                                        className="transition-colors hover:bg-[#FAF7F2] data-[active=true]:bg-[#F3E3DE] data-[active=true]:font-semibold data-[active=true]:text-[#AF4424]"
                                    >
                                        <Link
                                            href="/users"
                                            className="flex items-center gap-2.5"
                                        >
                                            <IconUsers className="size-4" />
                                            <span>Kelola User</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t">
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    );
}

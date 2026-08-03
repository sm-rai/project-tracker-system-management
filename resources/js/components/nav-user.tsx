import { Link, router } from '@inertiajs/react';
import {
    IconChevronUp,
    IconLogout,
    IconUser,
    IconUserCheck,
    IconUserShield,
} from '@tabler/icons-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { show as profile } from '@/routes/profile';

export function NavUser({
    user,
}: {
    user: {
        name: string;
        email: string;
        avatar?: string;
        role?: string;
    };
}) {
    const { isMobile } = useSidebar();
    const isAdmin = user.role === 'admin';
    const roleLabel = isAdmin ? 'Administrator' : 'Pengguna';
    const initials = user.name
        ? user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
        : 'US';

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="h-auto min-h-14 p-2 focus-visible:ring-2 focus-visible:ring-primary/30 data-[state=open]:bg-background-soft data-[state=open]:text-foreground"
                        >
                            <Avatar className="size-9 rounded-md">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-md bg-primary-surface font-semibold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.name}
                                </span>
                                <span
                                    className="truncate text-xs text-muted-foreground"
                                    title={`${roleLabel} · ${user.email}`}
                                >
                                    {roleLabel} · {user.email}
                                </span>
                            </div>
                            <IconChevronUp className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg p-1.5"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2.5 text-left text-sm">
                                <Avatar className="size-10 rounded-md">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-md bg-primary-surface font-semibold text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                    {user.role && (
                                        <span
                                            className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isAdmin ? 'bg-primary-surface text-primary' : 'bg-info-surface text-info'}`}
                                        >
                                            {isAdmin ? (
                                                <IconUserShield className="size-3" />
                                            ) : (
                                                <IconUserCheck className="size-3" />
                                            )}
                                            {roleLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-md px-2 py-2"
                        >
                            <Link href={profile.url()}>
                                <IconUser className="mr-2 size-4" />
                                Profil Saya
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer rounded-md px-2 py-2 text-danger focus:bg-danger-surface focus:text-danger"
                        >
                            <IconLogout className="mr-2 size-4" />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

<script setup lang="ts">
import { computed } from 'vue';
import { usePage, Link, router } from '@inertiajs/vue3';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, CalendarDays, Users, LogOut, ChevronsUpDown, Settings, FileText } from 'lucide-vue-next';
import logout from '@/actions/App/Http/Controllers/Auth/LogoutController';
import useAuth from '@/utils/composables/useAuth';

const page = usePage();
const user = useAuth(page.props);

const isAdmin = computed(() => {
    const roles = user.value?.roles;
    if (!roles || roles.length === 0) return false;
    return roles.includes('admin') || roles.includes('super-admin');
});

const currentPath = computed(() => page.url);

const mainNavItems = computed(() => [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]);

const managementItems = computed(() =>
    isAdmin.value
        ? [
              { label: 'Events', href: '/dashboard/events', icon: CalendarDays, badge: '8' },
              { label: 'Recruitment', href: '/dashboard/recruitment', icon: Users },
          ]
        : [{ label: 'Events', href: '/dashboard/user/events', icon: CalendarDays }]
);

function isActive(href: string): boolean {
    if (href === '/dashboard') return currentPath.value === '/dashboard';
    return currentPath.value.startsWith(href);
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function handleLogout() {
    router.post(logout().url);
}
</script>

<template>
    <Sidebar collapsible="icon" variant="sidebar" class="border-foreground bg-sidebar border-r-2">
        <SidebarHeader class="px-3 pt-3 pb-1">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child>
                        <a
                            href="/dashboard"
                            class="border-foreground flex items-center gap-3 rounded-2xl border-2 bg-white p-2 shadow-[4px_4px_0_var(--brutal-ink)]"
                        >
                            <div
                                class="bg-primary text-primary-foreground border-foreground flex size-9 items-center justify-center rounded-xl border-2 shadow-[3px_3px_0_var(--brutal-ink)]"
                            >
                                <FileText class="size-4" />
                            </div>
                            <div class="grid leading-none">
                                <span class="font-display text-lg font-extrabold tracking-tight">
                                    D<span class="text-primary">Form</span>
                                </span>
                                <span
                                    class="text-muted-foreground text-[10px] font-extrabold tracking-[0.12em] uppercase"
                                    >Event Manager</span
                                >
                            </div>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            <div
                class="border-foreground text-foreground mt-2 rounded-xl border-2 bg-(--brutal-yellow) px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] uppercase shadow-[3px_3px_0_var(--brutal-ink)]"
            >
                Workspace Ready
            </div>
        </SidebarHeader>

        <SidebarSeparator class="mx-3 my-2" />

        <SidebarContent class="px-2">
            <SidebarGroup
                class="border-foreground rounded-2xl border-2 bg-white p-2 shadow-[4px_4px_0_var(--brutal-ink)]"
            >
                <SidebarGroupLabel class="text-sidebar-foreground text-[10px] font-extrabold tracking-widest uppercase">
                    Main
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem v-for="item in mainNavItems" :key="item.href">
                            <SidebarMenuButton as-child :is-active="isActive(item.href)" :tooltip="item.label">
                                <Link :href="item.href">
                                    <component :is="item.icon" />
                                    <span>{{ item.label }}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup
                class="border-foreground mt-3 rounded-2xl border-2 bg-white p-2 shadow-[4px_4px_0_var(--brutal-ink)]"
            >
                <SidebarGroupLabel class="text-sidebar-foreground text-[10px] font-extrabold tracking-widest uppercase">
                    Management
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem v-for="item in managementItems" :key="item.href">
                            <SidebarMenuButton as-child :is-active="isActive(item.href)" :tooltip="item.label">
                                <Link :href="item.href">
                                    <component :is="item.icon" />
                                    <span>{{ item.label }}</span>
                                </Link>
                            </SidebarMenuButton>
                            <SidebarMenuBadge
                                v-if="'badge' in item && item.badge"
                                class="border-foreground text-foreground border-2 bg-(--brutal-mint) px-1.5 text-[10px] font-extrabold shadow-[2px_2px_0_var(--brutal-ink)]"
                            >
                                {{ item.badge }}
                            </SidebarMenuBadge>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup
                class="border-foreground mt-auto rounded-2xl border-2 bg-white p-2 shadow-[4px_4px_0_var(--brutal-ink)]"
            >
                <SidebarGroupLabel class="text-sidebar-foreground text-[10px] font-extrabold tracking-widest uppercase">
                    Account
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton as-child :is-active="isActive('/dashboard/profile')" tooltip="Profile">
                                <Link href="/dashboard/profile">
                                    <Settings />
                                    <span>Profile</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Log out"
                                class="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 active:bg-destructive/15"
                                @click="handleLogout"
                            >
                                <LogOut />
                                <span>Log out</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator class="mx-3 my-2" />

        <SidebarFooter class="px-3 pb-3">
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <SidebarMenuButton
                                size="lg"
                                class="border-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-2xl border-2 bg-white shadow-[4px_4px_0_var(--brutal-ink)] data-[state=open]:shadow-[3px_3px_0_var(--brutal-ink)]"
                            >
                                <Avatar class="size-7 rounded-md">
                                    <AvatarImage :src="user?.avatar ?? ''" :alt="user?.name ?? ''" />
                                    <AvatarFallback
                                        class="bg-primary text-primary-foreground border-foreground rounded-md border-2 text-[10px] font-extrabold"
                                    >
                                        {{ getInitials(user?.name ?? 'U') }}
                                    </AvatarFallback>
                                </Avatar>
                                <div class="grid flex-1 text-left text-sm leading-tight">
                                    <span class="truncate text-xs font-semibold">{{ user?.name }}</span>
                                    <span class="text-sidebar-foreground/50 truncate text-[10px]">{{
                                        user?.email
                                    }}</span>
                                </div>
                                <ChevronsUpDown class="text-sidebar-foreground/40 ml-auto size-3.5" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side="top"
                            align="start"
                            :side-offset="6"
                        >
                            <DropdownMenuLabel class="p-0 font-normal">
                                <div class="flex items-center gap-2.5 px-2 py-2">
                                    <Avatar class="size-8 rounded-md">
                                        <AvatarImage :src="user?.avatar ?? ''" :alt="user?.name ?? ''" />
                                        <AvatarFallback
                                            class="bg-primary text-primary-foreground border-foreground rounded-md border-2 text-xs font-extrabold"
                                        >
                                            {{ getInitials(user?.name ?? 'U') }}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div class="grid text-left text-sm leading-tight">
                                        <span class="truncate font-semibold">{{ user?.name }}</span>
                                        <span class="text-muted-foreground truncate text-xs">{{ user?.email }}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem as-child>
                                <Link href="/dashboard/profile" class="flex w-full items-center">
                                    <Settings class="mr-2 size-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                class="text-destructive focus:text-destructive focus:bg-destructive/10"
                                @click="handleLogout"
                            >
                                <LogOut class="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
    </Sidebar>
</template>

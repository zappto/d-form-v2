<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, Search, ChevronLeft, User } from 'lucide-vue-next';
import { resolveNavbarFallbackBackHref, pathWithoutQuery, routes } from '@/lib/routes';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import Breadcrumbs from '@/components/modules/dashboard/Breadcrumbs.vue';
import logout from '@/actions/App/Http/Controllers/Auth/LogoutController';
import UserAvatarFallback from '@/components/modules/user/UserAvatarFallback.vue';
import { userAvatarSeed } from '@/lib/userAvatarFallback';
import useAuth from '@/hooks/useAuth';
import { useTopbar } from '@/hooks/useDashboardTopbar';

const page = usePage();
const user = useAuth(page.props);
const topbar = useTopbar();

const siteName = computed(() => page.props.appName || 'DForm');

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Ekstrak judul halaman dari <title> ("Judul · DForm" → "Judul"). */
function titleFromDocument(): string {
    if (typeof document === 'undefined') return 'Dashboard';
    const suffix = `\\s*·\\s*${escapeRegExp(siteName.value)}\\s*$`;
    return document.title.replace(new RegExp(suffix), '').trim() || 'Dashboard';
}

const fallbackTitle = ref(titleFromDocument());
const search = ref('');

let titlePollId: number | null = null;

function syncTitle(): void {
    fallbackTitle.value = titleFromDocument();
}

onMounted(() => {
    syncTitle();
    // `titlechange` (Chrome 136+, 2025). Fallback: poll tiap 500ms saat navigasi Inertia.
    if (typeof document.addEventListener === 'function' && 'onTitleChange' in document) {
        document.addEventListener('titlechange', syncTitle);
    } else {
        titlePollId = window.setInterval(syncTitle, 500);
    }
});

onUnmounted(() => {
    if ('onTitleChange' in document) {
        document.removeEventListener('titlechange', syncTitle);
    }
    if (titlePollId !== null) {
        window.clearInterval(titlePollId);
    }
});

/** "super-admin" → "Super Admin". */
function formatRole(r: string): string {
    return r
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/** Label role utama user (role pertama, format judul); null bila user tak punya role. */
function primaryRoleLabel(roles: string[] | null | undefined): string | null {
    const firstRole = roles?.[0];
    return firstRole === undefined ? null : formatRole(firstRole);
}

/** Judul dari halaman (eksplisit) jika ada; fallback ke parsing document.title. */
const pageTitle = computed(() => topbar.title.value ?? fallbackTitle.value);

/** Breadcrumb dibangun dari lib terpisah (pure function). */
const breadcrumbItems = computed(() => buildBreadcrumbs(page.url, pageTitle.value));

/** Base pages (halaman utama) — back button disembunyikan di sini. */
const BASE_PAGE_PATHS = new Set<string>([
    routes.dashboard.index,
    routes.admin.index,
    routes.admin.events.index,
    routes.admin.recruitment.index,
    routes.member.joined,
    routes.member.browse,
]);

/** Tampilkan back button di semua halaman KECUALI base page. */
const showBackButton = computed(() => {
    const path = pathWithoutQuery(page.url);
    return !BASE_PAGE_PATHS.has(path);
});

function goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
        return;
    }
    router.visit(resolveNavbarFallbackBackHref(page.url));
}

const profileMenuOpen = ref(false);

function closeProfileMenu(): void {
    profileMenuOpen.value = false;
}

function handleLogout(): void {
    profileMenuOpen.value = false;
    router.post(logout().url);
}
</script>

<template>
    <header
        class="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border/50 bg-background/80 px-4 backdrop-blur-md lg:px-6"
    >
        <!-- Kiri: toggle sidebar (mobile) + back + judul + subtitle (judul hidden di mobile) -->
        <div class="flex min-w-0 items-center gap-1.5">
            <SidebarTrigger class="shrink-0 md:hidden" aria-label="Buka sidebar" />
            <Button
                radius="icon"
                v-if="showBackButton"
                variant="ghost"
                size="icon-sm"
                aria-label="Kembali"
                class="shrink-0 transition-colors duration-150 hover:bg-accent hover:text-foreground"
                @click="goBack"
            >
                <ChevronLeft class="size-4 shrink-0 stroke-[1.75]" />
            </Button>
            <div class="hidden min-w-0 flex-col sm:flex">
                <h1 class="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-foreground">
                    {{ pageTitle }}
                </h1>
                <div class="hidden min-w-0 sm:block">
                    <Breadcrumbs :items="breadcrumbItems" />
                </div>
            </div>
        </div>

        <!-- Tengah: search bar -->
        <div class="relative w-full max-w-[10rem] min-w-0 shrink sm:max-w-sm">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                v-model="search"
                type="search"
                placeholder="Cari..."
                class="h-9 rounded-lg border-transparent bg-muted/40 pl-9 focus-within:border-border focus-within:bg-background"
                aria-label="Cari"
            />
        </div>

        <!-- Kanan: menu profil (mobile) / blok identitas user + logout (desktop, tanpa separator) -->
        <div class="flex shrink-0 items-center gap-1.5">
            <Popover v-model:open="profileMenuOpen" :modal="false">
                <PopoverTrigger as-child>
                    <Button variant="ghost" size="icon" aria-label="Menu profil" class="rounded-full sm:hidden">
                        <UserAvatarFallback
                            :src="user?.avatar ?? null"
                            :seed="userAvatarSeed(user)"
                            avatar-class="size-8 rounded-full ring-1 ring-border"
                            fallback-round-class="rounded-full"
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" :side-offset="8" class="w-48 rounded-xl p-1">
                    <Link
                        :href="routes.dashboard.profile"
                        class="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0"
                        @click="closeProfileMenu"
                    >
                        <User class="size-4" aria-hidden="true" />
                        <span>Profil</span>
                    </Link>
                    <Button
                        variant="destructive-ghost"
                        type="button"
                        class="w-full cursor-pointer justify-start select-none"
                        @click="handleLogout"
                    >
                        <LogOut class="size-4" aria-hidden="true" />
                        <span>Keluar</span>
                    </Button>
                </PopoverContent>
            </Popover>

            <div class="hidden shrink-0 items-center gap-1.5 sm:flex">
                <Link
                    :href="routes.dashboard.profile"
                    aria-label="Profile"
                    class="flex items-center gap-2 rounded-xl py-1 pr-3 pl-2 transition-colors duration-150 hover:bg-accent"
                >
                    <UserAvatarFallback
                        :src="user?.avatar ?? null"
                        :seed="userAvatarSeed(user)"
                        avatar-class="size-8 rounded-full ring-1 ring-border"
                        fallback-round-class="rounded-full"
                    />
                    <span class="hidden flex-col sm:flex">
                        <span class="max-w-[140px] truncate text-sm leading-tight font-medium text-foreground">
                            {{ user?.name }}
                        </span>
                        <span class="max-w-[140px] truncate text-xs leading-tight text-muted-foreground">
                            {{ user?.roles?.length ? primaryRoleLabel(user.roles) : user?.email }}
                        </span>
                    </span>
                </Link>

                <Button variant="destructive-ghost" size="sm" aria-label="Keluar" @click="router.post(logout().url)">
                    <LogOut class="size-4" />
                    <span>Keluar</span>
                </Button>
            </div>
        </div>
    </header>
</template>

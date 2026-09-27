<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import { useEventListener } from '@vueuse/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, MapPin, Users, MoreVertical, SquarePen, Download, FileStack, Trash2 } from 'lucide-vue-next';
import EventBannerImage from '@/components/modules/dashboard/EventBannerImage.vue';
import { CATEGORY_COLOR_FALLBACK } from '@/lib/categoryColor';
import { categoryLabelMap, categoryColorMap } from '@/lib/dummyData';
import { eventStatusUi } from '@/lib/eventShowUi';
import { formatDisplayDate, formatRupiahPrice } from '@/lib/format';
import { routes } from '@/lib/routes';

const props = withDefaults(
    defineProps<{
        event: IEvent;
        href: string;
        canManage?: boolean;
        showPrice?: boolean;
        alertBadge?: string | null;
    }>(),
    { canManage: false, showPrice: true, alertBadge: null }
);

const emit = defineEmits<{ delete: [event: IEvent] }>();

function eventTokenList(v: string | string[]): string[] {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    if (typeof v === 'string')
        return v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    return [];
}

function formatPriceIdr(price: number): string {
    if (!price) return 'Gratis';
    try {
        return `Rp ${formatRupiahPrice(price)}`;
    } catch {
        return String(price);
    }
}

const categoryTokens = computed(() => eventTokenList(props.event.category));

// ── Kebab native (role-aware, hanya saat canManage) ───────────────────
const openMenuId = ref<string | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);

/**
 * Resolve a template ref to its DOM element. A `ref` on a component (e.g. `Button`) yields the
 * component instance, not the node, so fall back to its `$el` (VueUse `unrefElement` idiom).
 */
function toHtmlElement(refValue: Element | ComponentPublicInstance | null): HTMLElement | null {
    if (refValue instanceof HTMLElement) return refValue;
    if (refValue instanceof Element) return null;
    const root = refValue?.$el;
    return root instanceof HTMLElement ? root : null;
}

/** Simpan elemen pemicu menu (fallback `$el` untuk ref komponen) agar eksklusi klik pemicu hidup. */
function setTriggerRef(el: Element | ComponentPublicInstance | null): void {
    triggerRef.value = toHtmlElement(el);
}

/** Simpan elemen panel menu (fallback `$el` untuk ref komponen) agar eksklusi klik dalam panel hidup. */
function setMenuRef(el: Element | ComponentPublicInstance | null): void {
    menuRef.value = toHtmlElement(el);
}

function toggleMenu(): void {
    openMenuId.value = openMenuId.value === props.event.id ? null : props.event.id;
}

function closeMenu(): void {
    openMenuId.value = null;
}

function menuAction(action: () => void): void {
    closeMenu();
    action();
}

function openEdit(): void {
    router.visit(routes.admin.events.edit(props.event.id));
}

function openExport(): void {
    router.visit(routes.admin.events.exports.registrations(props.event.id));
}

function openForms(): void {
    router.visit(routes.admin.events.show(props.event.id));
}

function requestDelete(): void {
    emit('delete', props.event);
}

function closeIfOutside(target: EventTarget | null): void {
    if (openMenuId.value === null) return;
    if (!(target instanceof Node)) return;
    if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) return;
    closeMenu();
}

useEventListener('pointerdown', (e) => closeIfOutside(e.target));
useEventListener('click', (e) => closeIfOutside(e.target));
useEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});
</script>

<template>
    <div
        class="relative flex h-full min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-[0_2px_8px_-4px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-colors duration-150 hover:border-border/80 hover:shadow-[0_4px_16px_-6px_rgb(0_0_0/0.08)] sm:p-5"
    >
        <!-- Header row: badge kategori + alert + kebab (di luar Link) -->
        <div class="relative flex items-center justify-between gap-3">
            <div class="flex min-w-0 flex-wrap gap-1">
                <Badge
                    v-if="alertBadge"
                    variant="secondary"
                    class="border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-800"
                >
                    {{ alertBadge }}
                </Badge>
                <template v-if="categoryTokens.length > 0">
                    <Badge
                        v-for="cat in categoryTokens.slice(0, 1)"
                        :key="`${event.id}-cat-${cat}`"
                        class="border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm"
                        :style="{
                            backgroundColor: `color-mix(in oklab, ${categoryColorMap[cat] ?? CATEGORY_COLOR_FALLBACK} 12%, white)`,
                            borderColor: `color-mix(in oklab, ${categoryColorMap[cat] ?? CATEGORY_COLOR_FALLBACK} 30%, transparent)`,
                            color: categoryColorMap[cat] ?? CATEGORY_COLOR_FALLBACK,
                        }"
                    >
                        {{ categoryLabelMap[cat] ?? cat }}
                    </Badge>
                    <Badge
                        v-if="categoryTokens.length > 1"
                        variant="secondary"
                        class="border-0 bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm"
                    >
                        +{{ categoryTokens.length - 1 }}
                    </Badge>
                </template>
            </div>

            <Button
                radius="icon"
                v-if="canManage"
                variant="ghost"
                size="icon-sm"
                aria-label="Menu acara"
                class="relative size-8 shrink-0 cursor-pointer border border-border/60 bg-white/90 shadow-sm backdrop-blur-sm transition-colors duration-150 hover:bg-white"
                :ref="setTriggerRef"
                @click.stop="toggleMenu"
            >
                <MoreVertical class="size-4 shrink-0 stroke-[1.75]" />
            </Button>

            <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 scale-[0.96] translate-y-1"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-[0.96] translate-y-1"
            >
                <div
                    v-if="canManage && openMenuId === event.id"
                    :ref="setMenuRef"
                    class="absolute top-10 right-0 z-[20] min-w-48 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-sm"
                >
                    <button
                        type="button"
                        class="relative flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        @click="menuAction(openEdit)"
                    >
                        <SquarePen class="mr-2 size-4 shrink-0 stroke-[1.75]" />Edit acara
                    </button>
                    <button
                        type="button"
                        class="relative flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        @click="menuAction(openExport)"
                    >
                        <Download class="mr-2 size-4 shrink-0 stroke-[1.75]" />Export data
                    </button>
                    <button
                        type="button"
                        class="relative flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        @click="menuAction(openForms)"
                    >
                        <FileStack class="mr-2 size-4 shrink-0 stroke-[1.75]" />Kelola formulir
                    </button>
                    <div class="my-1 h-px bg-border" />
                    <Button
                        variant="destructive-ghost"
                        type="button"
                        class="w-full cursor-pointer justify-start"
                        @click="menuAction(requestDelete)"
                    >
                        <Trash2 class="mr-2 size-4 shrink-0 stroke-[1.75]" />Hapus acara
                    </Button>
                </div>
            </Transition>
        </div>

        <!-- Banner bersih (di luar Link — tidak redirect) -->
        <div class="relative aspect-[16/7] w-full overflow-hidden rounded-xl bg-muted">
            <EventBannerImage :src="event.banner_url" :alt="event.title" img-class="size-full object-cover" />
        </div>

        <!-- Konten: hanya ini yang redirect ke detail -->
        <Link
            :href="href"
            class="block min-w-0 flex-1 rounded-b-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <div class="flex h-full flex-col gap-2.5">
                <div class="flex items-center gap-3">
                    <h3
                        class="min-w-0 flex-1 truncate text-sm leading-snug font-semibold tracking-tight text-foreground"
                    >
                        {{ event.title }}
                    </h3>
                    <Badge
                        variant="outline"
                        :class="[
                            'shrink-0 px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                            eventStatusUi(event.registration_status).tone,
                        ]"
                    >
                        {{ eventStatusUi(event.registration_status).label }}
                    </Badge>
                </div>

                <div class="flex items-center gap-1.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                    <CalendarDays class="mt-0.5 size-3.5 shrink-0 stroke-[1.75] text-primary/70" aria-hidden="true" />
                    <span class="leading-snug">
                        {{ formatDisplayDate(event.start_date) }} — {{ formatDisplayDate(event.end_date) }}
                    </span>
                </div>

                <div class="flex items-center gap-1.5 text-xs leading-snug text-muted-foreground sm:text-[13px]">
                    <MapPin class="mt-0.5 size-3.5 shrink-0 stroke-[1.75] text-primary/70" aria-hidden="true" />
                    <span class="line-clamp-1 leading-snug">{{ event.location }}</span>
                </div>

                <div class="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                    <div class="flex min-w-0 items-center gap-3">
                        <span class="flex items-center gap-1.5 text-muted-foreground">
                            <Users class="size-3.5 shrink-0 stroke-[1.75] text-muted-foreground" aria-hidden="true" />
                            <span class="font-medium tabular-nums">
                                {{ event.registered_count }}/{{ event.quota }}
                            </span>
                        </span>
                        <Progress
                            :model-value="Math.min(event.registered_count, Math.max(event.quota, 1))"
                            :max="Math.max(event.quota, 1)"
                            class="h-1.5 min-w-0 flex-1 bg-muted/70"
                        />
                    </div>
                    <span v-if="showPrice" class="shrink-0 font-medium text-foreground tabular-nums">
                        {{ formatPriceIdr(event.price) }}
                    </span>
                </div>
            </div>
        </Link>
    </div>
</template>

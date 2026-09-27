<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, ArrowRight } from 'lucide-vue-next';
import { routes } from '@/lib/routes';
import { eventCardBannerContainerClass } from '@/lib/eventBannerAspect';
import { eventStatusUi } from '@/lib/eventShowUi';
import EventBannerImage from '@/components/modules/dashboard/EventBannerImage.vue';

const props = defineProps<{
    events: IEvent[];
}>();

const visible = ref(false);
onMounted(() => {
    const obs = new IntersectionObserver(
        ([e]) => {
            if (e?.isIntersecting) {
                visible.value = true;
                obs.disconnect();
            }
        },
        { threshold: 0.1 }
    );
    const el = document.getElementById('event-highlight');
    if (el) obs.observe(el);
});

const featured = computed(() => props.events.slice(0, 3));
</script>

<template>
    <section id="event-highlight" class="bg-muted/30 py-24 md:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-10">
            <div
                :class="[
                    'mx-auto mb-14 max-w-2xl text-center transition-all duration-500',
                    visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                ]"
            >
                <p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Sorotan</p>
                <h2 class="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Acara yang sedang berlangsung
                </h2>
                <p class="mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                    Beberapa acara pilihan yang saat ini membuka pendaftaran. Jangan lewatkan kesempatan untuk
                    bergabung.
                </p>
            </div>

            <div v-if="featured.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card
                    v-for="(ev, i) in featured"
                    :key="ev.id"
                    :class="[
                        'group gap-0 overflow-hidden border-border/40 p-0 transition-all duration-500 hover:border-primary/25 hover:shadow-sm',
                        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                    ]"
                    :style="{ transitionDelay: `${100 + i * 80}ms` }"
                >
                    <div :class="eventCardBannerContainerClass()">
                        <div class="absolute inset-0 z-0">
                            <EventBannerImage
                                :src="ev.banner_url"
                                :alt="ev.title"
                                img-class="transition-colors duration-300"
                            />
                        </div>
                        <Badge
                            variant="outline"
                            :class="[
                                'absolute top-3 right-3 z-[1] text-[10px] backdrop-blur-sm',
                                eventStatusUi(ev.registration_status).tone,
                            ]"
                        >
                            {{ eventStatusUi(ev.registration_status).label }}
                        </Badge>
                    </div>

                    <CardContent class="p-5">
                        <h3
                            class="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary"
                        >
                            {{ ev.title }}
                        </h3>

                        <div class="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                            <span v-if="ev.location" class="flex items-center gap-1.5">
                                <MapPin class="size-3.5 shrink-0" />
                                {{ ev.location }}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <Users class="size-3.5 shrink-0" />
                                {{ ev.registered_count }} / {{ ev.quota }} pendaftar
                            </span>
                        </div>

                        <Button as-child variant="outline" size="sm" class="mt-4 h-9 w-full text-xs font-medium">
                            <a
                                :href="routes.landing.events.show(ev.slug)"
                                class="inline-flex items-center justify-center gap-1.5"
                            >
                                Lihat Detail
                                <ArrowRight class="size-3.5" />
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div v-else class="mx-auto max-w-md rounded-2xl border border-border/40 bg-card p-10 text-center">
                <p class="text-sm text-muted-foreground">Belum ada acara yang tersedia saat ini.</p>
            </div>
        </div>
    </section>
</template>

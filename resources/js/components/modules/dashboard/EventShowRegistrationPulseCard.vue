<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

defineProps<{
    event: IEvent;
    fillPercent: number;
    remainingSeats: number;
    progressTone: { ring: string; label: string; pill: string };
    cardShadow: string;
    formatDateTime: (v: string) => string;
}>();
</script>

<template>
    <Card :class="['border-border/60 overflow-hidden rounded-2xl', cardShadow]">
        <CardContent class="grid min-w-0 gap-5 p-4 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-6">
            <div class="relative mx-auto size-32 shrink-0 sm:mx-0 sm:size-36">
                <svg viewBox="0 0 120 120" class="size-full -rotate-90">
                    <circle
                        cx="60"
                        cy="60"
                        r="52"
                        stroke="currentColor"
                        stroke-width="10"
                        fill="none"
                        class="text-muted/50"
                    />
                    <circle
                        cx="60"
                        cy="60"
                        r="52"
                        stroke="currentColor"
                        stroke-width="10"
                        fill="none"
                        stroke-linecap="round"
                        :stroke-dasharray="2 * Math.PI * 52"
                        :stroke-dashoffset="2 * Math.PI * 52 * (1 - fillPercent / 100)"
                        :class="[progressTone.ring, 'transition-[stroke-dashoffset] duration-700 ease-out']"
                    />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-foreground text-3xl font-semibold tracking-tight tabular-nums"
                        >{{ fillPercent }}%</span
                    >
                    <span class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">filled</span>
                </div>
            </div>

            <div class="min-w-0 text-center sm:text-left">
                <p class="text-foreground/85 text-[0.9375rem] leading-relaxed">
                    <span class="font-semibold tabular-nums">{{ event.registered_count.toLocaleString() }}</span>
                    of
                    <span class="font-semibold tabular-nums">{{ event.quota.toLocaleString() }}</span>
                    seats are taken —
                    <span class="text-muted-foreground">{{ remainingSeats.toLocaleString() }} still open.</span>
                </p>

                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    <div class="border-border/50 bg-muted/30 rounded-xl border px-3.5 py-2.5">
                        <p class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Opens</p>
                        <p class="text-foreground mt-0.5 text-[13px] font-medium break-words">
                            {{ formatDateTime(event.registration_start) }}
                        </p>
                    </div>
                    <div class="border-border/50 bg-muted/30 rounded-xl border px-3.5 py-2.5">
                        <p class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Closes</p>
                        <p class="text-foreground mt-0.5 text-[13px] font-medium break-words">
                            {{ formatDateTime(event.registration_end) }}
                        </p>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

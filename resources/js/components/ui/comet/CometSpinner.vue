<script setup lang="ts">
import { computed } from 'vue';

interface CometSpinnerProps {
    size?: number;
    headScale?: number;
    radiusScale?: number;
    label?: string;
}

const props = withDefaults(defineProps<CometSpinnerProps>(), {
    size: 16,
    headScale: 0.2,
    radiusScale: 0.83,
    label: 'Loading',
});

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function toCqmin(value: number): string {
    return `${parseFloat(value.toFixed(2))}cqmin`;
}

const headCqmin = computed<string>(() => toCqmin(clamp(props.headScale, 0.08, 0.35) * 100));
const radiusCqmin = computed<string>(() => toCqmin(clamp(props.radiusScale, 0.3, 1.1) * 100));
const boxPx = computed<string>(() => `${props.size}px`);
</script>

<template>
    <span
        class="comet"
        role="status"
        :aria-label="props.label"
        :style="{
            width: boxPx,
            height: boxPx,
            fontSize: boxPx,
            '--loading-ui-comet-head': headCqmin,
            '--loading-ui-comet-radius': radiusCqmin,
        }"
    >
        <span class="comet-inner" aria-hidden="true" />
        <span class="sr-only">{{ props.label }}</span>
    </span>
</template>

<style scoped>
.comet {
    --duration: 1.7s;
    --easing: ease;
    --loading-ui-comet-head: 20cqmin;
    --loading-ui-comet-radius: 83cqmin;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    container-type: size;
    flex: none;
    line-height: 0;
    vertical-align: middle;
}
.comet-inner {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    transform: translateZ(0);
    animation:
        loading-ui-comet-shadow var(--duration, 1.7s) infinite var(--easing, ease),
        loading-ui-comet-rotation var(--duration, 1.7s) infinite var(--easing, ease);
}
@keyframes loading-ui-comet-shadow {
    0% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.1),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.3),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.385);
    }
    5%,
    95% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.1),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.3),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.385);
    }
    10%,
    59% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            calc(var(--loading-ui-comet-radius) * -0.105) calc(var(--loading-ui-comet-radius) * -0.994) 0
                calc(var(--loading-ui-comet-head) * -2.1),
            calc(var(--loading-ui-comet-radius) * -0.208) calc(var(--loading-ui-comet-radius) * -0.978) 0
                calc(var(--loading-ui-comet-head) * -2.2),
            calc(var(--loading-ui-comet-radius) * -0.308) calc(var(--loading-ui-comet-radius) * -0.95) 0
                calc(var(--loading-ui-comet-head) * -2.3),
            calc(var(--loading-ui-comet-radius) * -0.358) calc(var(--loading-ui-comet-radius) * -0.934) 0
                calc(var(--loading-ui-comet-head) * -2.385);
    }
    20% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            calc(var(--loading-ui-comet-radius) * -0.407) calc(var(--loading-ui-comet-radius) * -0.913) 0
                calc(var(--loading-ui-comet-head) * -2.1),
            calc(var(--loading-ui-comet-radius) * -0.669) calc(var(--loading-ui-comet-radius) * -0.743) 0
                calc(var(--loading-ui-comet-head) * -2.2),
            calc(var(--loading-ui-comet-radius) * -0.808) calc(var(--loading-ui-comet-radius) * -0.588) 0
                calc(var(--loading-ui-comet-head) * -2.3),
            calc(var(--loading-ui-comet-radius) * -0.902) calc(var(--loading-ui-comet-radius) * -0.41) 0
                calc(var(--loading-ui-comet-head) * -2.385);
    }
    38% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            calc(var(--loading-ui-comet-radius) * -0.454) calc(var(--loading-ui-comet-radius) * -0.892) 0
                calc(var(--loading-ui-comet-head) * -2.1),
            calc(var(--loading-ui-comet-radius) * -0.777) calc(var(--loading-ui-comet-radius) * -0.629) 0
                calc(var(--loading-ui-comet-head) * -2.2),
            calc(var(--loading-ui-comet-radius) * -0.934) calc(var(--loading-ui-comet-radius) * -0.358) 0
                calc(var(--loading-ui-comet-head) * -2.3),
            calc(var(--loading-ui-comet-radius) * -0.988) calc(var(--loading-ui-comet-radius) * -0.108) 0
                calc(var(--loading-ui-comet-head) * -2.385);
    }
    100% {
        box-shadow:
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.1),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.2),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.3),
            0 calc(var(--loading-ui-comet-radius) * -1) 0 calc(var(--loading-ui-comet-head) * -2.385);
    }
}
@keyframes loading-ui-comet-rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
/* Fallback browser tanpa cqmin: vars dalam em (font-size = ukuran box) */
@supports not (width: 1cqmin) {
    .comet {
        --loading-ui-comet-head: 0.2em;
        --loading-ui-comet-radius: 0.83em;
    }
}
@media (prefers-reduced-motion: reduce) {
    .comet-inner {
        animation: none;
    }
}
</style>

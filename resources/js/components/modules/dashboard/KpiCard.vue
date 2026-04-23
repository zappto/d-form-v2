<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

const props = defineProps<{
    label: string
    value: string | number
    trend?: number
    icon: Component
    color?: 'primary' | 'success' | 'warning' | 'destructive'
}>()

const visible = ref(false)
onMounted(() => requestAnimationFrame(() => (visible.value = true)))

const isPositive = computed(() => (props.trend ?? 0) >= 0)

const colorClasses = computed(() => {
    const map: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        destructive: 'bg-destructive/10 text-destructive',
    }
    return map[props.color ?? 'primary']
})
</script>

<template>
    <Card
        :class="cn(
            'rounded-xl border shadow-xs transition-all duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        )"
    >
        <CardContent class="p-5">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium tracking-wide text-muted-foreground">{{ label }}</p>
                    <p class="mt-2 text-2xl font-semibold tracking-tight">{{ value }}</p>
                    <div v-if="trend !== undefined" class="mt-2 flex items-center gap-1">
                        <component
                            :is="isPositive ? TrendingUp : TrendingDown"
                            :class="cn('size-3.5', isPositive ? 'text-success' : 'text-destructive')"
                        />
                        <span
                            :class="cn('text-xs font-medium', isPositive ? 'text-success' : 'text-destructive')"
                        >
                            {{ isPositive ? '+' : '' }}{{ trend }}%
                        </span>
                        <span class="text-xs text-muted-foreground">vs last month</span>
                    </div>
                </div>
                <div :class="cn('flex size-10 shrink-0 items-center justify-center rounded-xl', colorClasses)">
                    <component :is="icon" class="size-5" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>

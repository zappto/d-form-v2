<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-vue-next'
import { groupReviewStatusBadge, memberConfirmationStatusBadge } from '@/lib/formSubmissionsUi'
import { userAvatarSeed } from '@/lib/userAvatarFallback'
import UserAvatarFallback from '@/components/modules/user/UserAvatarFallback.vue'

defineProps<{
    bundleGroups: IBundleSubmissionGroup[]
    formatDate: (v: string) => string
}>()

const emit = defineEmits<{
    openGroup: [group: IBundleSubmissionGroup]
}>()

function onCardKeydown(e: KeyboardEvent, group: IBundleSubmissionGroup) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        emit('openGroup', group)
    }
}
</script>

<template>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
            v-for="(group, idx) in bundleGroups"
            :key="group.group_token"
            role="button"
            tabindex="0"
            class="app-surface animate-app-fade-in flex cursor-pointer flex-col rounded-2xl border border-border/80 p-5 shadow-sm transition-[box-shadow,background-color,border-color] outline-none hover:border-border hover:bg-muted/[0.12] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            :style="{ animationDelay: `${idx * 100}ms` }"
            :aria-label="`Buka detail group: ${group.leader.user?.name ?? 'Tanpa nama'}`"
            @click="emit('openGroup', group)"
            @keydown="onCardKeydown($event, group)"
        >
            <div class="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
                <div class="flex min-w-0 flex-1 items-start gap-3.5">
                    <UserAvatarFallback
                        :src="group.leader.user?.avatar ?? null"
                        :seed="userAvatarSeed(group.leader.user)"
                        avatar-class="size-12 shrink-0 rounded-2xl border border-border/80 shadow-sm"
                        fallback-round-class="rounded-2xl"
                    />
                    <div class="min-w-0 flex-1 pt-0.5">
                        <h4 class="truncate text-[0.9375rem] font-semibold leading-tight tracking-tight text-foreground">
                            {{ group.leader.user?.name ?? 'Tanpa nama' }}
                        </h4>
                        <p class="mt-1.5 truncate text-[0.8125rem] leading-snug text-muted-foreground">
                            {{ group.leader.user?.email ?? 'Tidak ada email' }}
                        </p>
                        <p class="mt-1.5 truncate font-mono text-[0.6875rem] font-medium leading-snug text-muted-foreground/70">
                            {{ group.group_token }}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                    :class="groupReviewStatusBadge(group.group_review_status).class"
                >
                    {{ groupReviewStatusBadge(group.group_review_status).label }}
                </Badge>
            </div>

            <div class="mt-4 flex flex-1 flex-col gap-3">
                <div class="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                    <Users class="size-4 shrink-0 opacity-70" aria-hidden="true" />
                    <span class="font-medium">{{ group.total_participants }} peserta</span>
                </div>

                <div class="flex flex-wrap gap-2">
                    <Badge
                        v-if="group.accepted_count > 0"
                        variant="outline"
                        class="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                        :class="memberConfirmationStatusBadge('accepted').class"
                    >
                        {{ group.accepted_count }} Diterima
                    </Badge>
                    <Badge
                        v-if="group.pending_count > 0"
                        variant="outline"
                        class="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                        :class="memberConfirmationStatusBadge('pending').class"
                    >
                        {{ group.pending_count }} Menunggu
                    </Badge>
                    <Badge
                        v-if="group.rejected_count > 0"
                        variant="outline"
                        class="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                        :class="memberConfirmationStatusBadge('rejected').class"
                    >
                        {{ group.rejected_count }} Ditolak
                    </Badge>
                    <Badge
                        v-if="group.expired_count > 0"
                        variant="outline"
                        class="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                        :class="memberConfirmationStatusBadge('expired').class"
                    >
                        {{ group.expired_count }} Kedaluwarsa
                    </Badge>
                </div>

                <div
                    class="mt-auto flex items-start justify-between gap-3 rounded-lg bg-muted/15 px-1 py-2 text-[0.8125rem] tabular-nums text-muted-foreground"
                >
                    <span class="flex items-center gap-2 font-medium text-muted-foreground/90">
                        <Clock class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                        Dikirim
                    </span>
                    <time class="text-right font-medium leading-snug text-foreground" :datetime="group.submitted_at">
                        {{ formatDate(group.submitted_at) }}
                    </time>
                </div>
            </div>
        </div>
    </div>
</template>

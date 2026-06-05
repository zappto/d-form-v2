<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, Lock, X } from 'lucide-vue-next'
import {
    memberConfirmationStatusBadge,
    registrationRoleLabel,
    submissionReviewBadge,
} from '@/lib/formSubmissionsUi'
import { userAvatarSeed } from '@/lib/userAvatarFallback'
import { cn } from '@/lib/utils'
import UserAvatarFallback from '@/components/modules/user/UserAvatarFallback.vue'

const props = defineProps<{
    group: IBundleSubmissionGroup | null
    formatDate: (v: string) => string
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
    openDetail: [submission: IBundleSubmissionMember]
}>()

const sortedMembers = computed(() => {
    if (!props.group) return []
    
    const accepted = props.group.members.filter((m) => m.member_confirmation_status === 'accepted')
    const pending = props.group.members.filter((m) => m.member_confirmation_status === 'pending')
    const rejected = props.group.members.filter((m) => m.member_confirmation_status === 'rejected')
    const expired = props.group.members.filter((m) => m.member_confirmation_status === 'expired')
    
    return [...accepted, ...pending, ...rejected, ...expired]
})

function onParticipantClick(member: IBundleSubmissionMember) {
    if (!member.can_open_detail) return
    emit('openDetail', member)
}

function onParticipantKeydown(e: KeyboardEvent, member: IBundleSubmissionMember) {
    if (member.can_open_detail && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        emit('openDetail', member)
    }
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent
            :class="
                cn(
                    '!flex flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl',
                    'max-md:top-0 max-md:right-0 max-md:bottom-0 max-md:left-0 max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0',
                    'md:top-[50%] md:left-[50%] md:h-auto md:max-h-[min(90vh,56rem)] md:w-full md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-xl md:border',
                )
            "
        >
            <div
                class="shrink-0 border-b border-border/80 bg-gradient-to-b from-muted/25 via-muted/[0.07] to-background px-5 pb-6 pt-6 pr-14 md:px-7 md:pb-7"
            >
                <div class="flex items-start gap-4 md:gap-5">
                    <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-muted/30 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border/40 md:size-16">
                        <Users class="size-7 text-muted-foreground opacity-80 md:size-8" aria-hidden="true" />
                    </div>

                    <div class="min-w-0 flex-1 space-y-2.5">
                        <p class="text-[0.6875rem] font-medium text-muted-foreground md:text-xs">
                            Detail group bundle
                        </p>

                        <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                            <h2
                                class="min-w-0 max-w-[min(100%,28rem)] text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-[1.375rem] md:text-2xl"
                            >
                                {{ group?.leader.user?.name ?? 'Tanpa nama' }}
                            </h2>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <p class="font-mono text-[0.6875rem] font-medium text-muted-foreground">
                                {{ group?.group_token }}
                            </p>
                            <span class="text-muted-foreground/50">•</span>
                            <p class="text-[0.8125rem] text-muted-foreground">
                                {{ group?.total_participants }} peserta
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-7 pb-28 md:px-7 md:pb-24">
                <section v-if="group" class="space-y-4">
                    <div>
                        <h3 class="text-[0.9375rem] font-semibold leading-snug text-foreground">Ketua group</h3>
                        <p class="mt-1 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
                            Pendaftar utama yang membuat group bundle ini.
                        </p>
                    </div>

                    <div
                        role="button"
                        tabindex="0"
                        class="flex cursor-pointer items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:p-5"
                        @click="emit('openDetail', group.leader)"
                        @keydown="onParticipantKeydown($event, group.leader)"
                    >
                        <UserAvatarFallback
                            :src="group.leader.user?.avatar ?? null"
                            :seed="userAvatarSeed(group.leader.user)"
                            avatar-class="size-12 shrink-0 rounded-xl border border-border/80 shadow-sm"
                            fallback-round-class="rounded-xl"
                        />

                        <div class="min-w-0 flex-1 space-y-2">
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0 flex-1">
                                    <h4 class="truncate text-[0.9375rem] font-semibold leading-tight text-foreground">
                                        {{ group.leader.user?.name ?? 'Tanpa nama' }}
                                    </h4>
                                    <p class="mt-1 truncate text-[0.8125rem] leading-snug text-muted-foreground">
                                        {{ group.leader.user?.email ?? 'Tidak ada email' }}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    class="shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                                    :class="submissionReviewBadge(group.leader.review_status).class"
                                >
                                    {{ submissionReviewBadge(group.leader.review_status).label }}
                                </Badge>
                            </div>

                            <div class="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    class="rounded-full border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-medium text-primary"
                                >
                                    Ketua
                                </Badge>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-if="group && sortedMembers.length > 0" class="space-y-4">
                    <div>
                        <h3 class="text-[0.9375rem] font-semibold leading-snug text-foreground">Anggota group</h3>
                        <p class="mt-1 max-w-prose text-[0.8125rem] leading-relaxed text-muted-foreground">
                            Peserta yang diundang oleh ketua. Anggota dengan status menunggu tidak dapat direview.
                        </p>
                    </div>

                    <div class="space-y-3">
                        <div
                            v-for="member in sortedMembers"
                            :key="member.id"
                            :role="member.can_open_detail ? 'button' : undefined"
                            :tabindex="member.can_open_detail ? 0 : undefined"
                            :class="
                                cn(
                                    'flex items-start gap-4 rounded-2xl border border-border/70 p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] md:p-5',
                                    member.can_open_detail
                                        ? 'cursor-pointer bg-card/50 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                                        : 'cursor-not-allowed bg-muted/10 opacity-60',
                                )
                            "
                            @click="onParticipantClick(member)"
                            @keydown="onParticipantKeydown($event, member)"
                        >
                            <div class="relative">
                                <UserAvatarFallback
                                    :src="member.user?.avatar ?? null"
                                    :seed="userAvatarSeed(member.user)"
                                    avatar-class="size-12 shrink-0 rounded-xl border border-border/80 shadow-sm"
                                    fallback-round-class="rounded-xl"
                                />
                                <div
                                    v-if="!member.can_open_detail"
                                    class="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px]"
                                >
                                    <Lock class="size-5 text-muted-foreground" aria-hidden="true" />
                                </div>
                            </div>

                            <div class="min-w-0 flex-1 space-y-2.5">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0 flex-1">
                                        <h4
                                            class="truncate text-[0.9375rem] font-semibold leading-tight"
                                            :class="member.can_open_detail ? 'text-foreground' : 'text-muted-foreground'"
                                        >
                                            {{ member.user?.name ?? member.invited_email ?? 'Tanpa nama' }}
                                        </h4>
                                        <p class="mt-1 truncate text-[0.8125rem] leading-snug text-muted-foreground">
                                            {{ member.user?.email ?? member.invited_email ?? 'Tidak ada email' }}
                                        </p>
                                    </div>
                                    <Badge
                                        v-if="member.can_open_detail"
                                        variant="outline"
                                        class="shrink-0 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium"
                                        :class="submissionReviewBadge(member.review_status).class"
                                    >
                                        {{ submissionReviewBadge(member.review_status).label }}
                                    </Badge>
                                </div>

                                <div class="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        class="rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
                                        :class="memberConfirmationStatusBadge(member.member_confirmation_status).class"
                                    >
                                        {{ memberConfirmationStatusBadge(member.member_confirmation_status).label }}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        class="rounded-full border-muted-foreground/25 bg-muted/20 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                                    >
                                        Anggota
                                    </Badge>
                                </div>

                                <div
                                    v-if="member.locked_reason && !member.can_open_detail"
                                    class="flex gap-2.5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2"
                                >
                                    <Lock class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    <p class="text-[0.75rem] leading-relaxed text-muted-foreground">
                                        {{ member.locked_reason }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-if="group && sortedMembers.length === 0" class="py-8 text-center">
                    <div class="mx-auto flex size-16 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10">
                        <Users class="size-8 text-muted-foreground opacity-60" aria-hidden="true" />
                    </div>
                    <p class="mt-4 text-sm text-muted-foreground">
                        Belum ada anggota dalam group ini.
                    </p>
                </section>
            </div>
        </DialogContent>
    </Dialog>
</template>

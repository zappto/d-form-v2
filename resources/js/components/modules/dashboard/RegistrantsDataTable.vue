<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    registrantRelativeTimeId,
    registrantStatusBadgeClass,
    registrantStatusLabel,
} from '@/lib/registrantsUi'
import UserAvatarFallback from '@/components/modules/user/UserAvatarFallback.vue'
import { userAvatarSeed } from '@/lib/userAvatarFallback'
import { formatSubmissionDateTime } from '@/lib/format'
import { FileText } from 'lucide-vue-next'

defineProps<{
    rows: IRegistrant[] | undefined
}>()

function formatSubmittedDetail(iso: string): string {
    try {
        return formatSubmissionDateTime(iso)
    } catch {
        return iso
    }
}
</script>

<template>
    <Card :class="['rounded-xl border-border/70 shadow-xs', rows ? 'fade-up' : '']">
        <CardHeader class="pb-3">
            <CardTitle class="text-base font-medium">Daftar pengiriman</CardTitle>
            <CardDescription v-if="rows" class="text-sm">
                Menampilkan {{ rows.length }} baris sesuai filter saat ini. Kolom formulir menunjukkan sumber pengiriman.
            </CardDescription>
            <Skeleton v-else class="h-4 w-2/5" aria-hidden="true" />
        </CardHeader>
        <CardContent class="overflow-x-auto px-0 pt-0 sm:px-6">
            <table class="w-full min-w-[640px] text-sm">
                <thead>
                    <tr class="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th class="px-4 py-3 sm:px-6">Pendaftar</th>
                        <th class="hidden px-4 py-3 md:table-cell md:px-6">Formulir</th>
                        <th class="px-4 py-3 sm:px-6">Status</th>
                        <th class="hidden px-4 py-3 font-normal lg:table-cell lg:px-6">Kode</th>
                        <th class="px-4 py-3 sm:px-6">Waktu kirim</th>
                    </tr>
                </thead>
                <tbody v-if="!rows" aria-busy="true" aria-label="Memuat pendaftar">
                    <tr
                        v-for="n in 10"
                        :key="`reg-skel-${n}`"
                        class="reg-row-skeleton border-b border-border/60 last:border-0"
                    >
                        <td class="px-4 py-4 align-top sm:px-6">
                            <div class="flex items-start gap-3">
                                <Skeleton class="size-10 shrink-0 rounded-full" />
                                <div class="min-w-0 flex-1 space-y-2">
                                    <Skeleton class="h-4 w-3/4" />
                                    <Skeleton class="h-3 w-full" />
                                </div>
                            </div>
                        </td>
                        <td class="hidden max-w-[14rem] px-4 py-4 align-top md:table-cell md:px-6">
                            <Skeleton class="h-4 w-full" />
                        </td>
                        <td class="px-4 py-4 align-top sm:px-6">
                            <Skeleton class="h-6 w-20 rounded-full" />
                        </td>
                        <td class="hidden px-4 py-4 align-top lg:table-cell lg:px-6">
                            <Skeleton class="h-3 w-16" />
                        </td>
                        <td class="px-4 py-4 align-top sm:px-6">
                            <div class="space-y-2">
                                <Skeleton class="h-4 w-24" />
                                <Skeleton class="h-3 w-32" />
                            </div>
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr
                        v-for="reg in rows"
                        :key="reg.id"
                        class="border-b border-border/60 last:border-0 hover:bg-muted/30"
                    >
                        <td class="px-4 py-4 align-top sm:px-6">
                            <div class="flex items-start gap-3">
                                <UserAvatarFallback
                                    :src="reg.user.avatar"
                                    :seed="userAvatarSeed(reg.user)"
                                    avatar-class="size-10 shrink-0 ring-1 ring-border"
                                />
                                <div class="min-w-0">
                                    <p class="truncate font-medium text-foreground">{{ reg.user.name }}</p>
                                    <p class="truncate text-sm text-muted-foreground">{{ reg.user.email }}</p>
                                    <div class="mt-2 flex items-start gap-1.5 md:hidden">
                                        <FileText class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                        <span class="line-clamp-2 text-xs leading-snug text-foreground">
                                            {{ reg.form.title }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="hidden max-w-[14rem] px-4 py-4 align-top md:table-cell md:px-6">
                            <Badge variant="secondary" class="line-clamp-3 whitespace-normal text-left text-xs font-normal leading-snug">
                                {{ reg.form.title }}
                            </Badge>
                        </td>
                        <td class="px-4 py-4 align-top sm:px-6">
                            <span
                                :class="[
 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
 registrantStatusBadgeClass(reg.status),
 ]"
                            >
                                <span class="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden="true" />
                                {{ registrantStatusLabel(reg.status) }}
                            </span>
                        </td>
                        <td class="hidden px-4 py-4 align-top font-mono text-xs text-muted-foreground lg:table-cell lg:px-6">
                            <span v-if="reg.registration_code">{{ reg.registration_code }}</span>
                            <span v-else>—</span>
                        </td>
                        <td class="px-4 py-4 align-top sm:px-6">
                            <p class="text-sm font-medium text-foreground">{{ registrantRelativeTimeId(reg.submitted_at) }}</p>
                            <p class="text-xs text-muted-foreground">{{ formatSubmittedDetail(reg.submitted_at) }}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div
                v-if="!rows"
                class="reg-pager-skeleton flex items-center justify-between gap-2 px-4 py-3.5 sm:px-6"
                aria-hidden="true"
            >
                <Skeleton class="h-4 w-32" />
                <div class="flex gap-2">
                    <Skeleton class="h-8 w-24" />
                    <Skeleton class="h-8 w-24" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>

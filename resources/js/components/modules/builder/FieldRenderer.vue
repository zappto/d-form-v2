<script setup lang="ts">
import { computed } from 'vue';
import { optionLabel } from '@/components/modules/builder/fieldMapping';
import { resolveOptionImagePreviewSrc } from '@/components/modules/builder/optionImage';
import FormParagraphContent from '@/components/modules/dashboard/FormParagraphContent.vue';
import type { BuilderField, IFieldOptionEntry } from '@/types/form-builder';
import {
    Type,
    AlignLeft,
    Mail,
    Phone,
    Hash,
    ChevronDown,
    SquareCheck,
    CircleDot,
    ImagePlus,
    Upload,
    Calendar,
    Clock,
    Star,
    Heading as HeadingIcon,
    TextCursorInput,
    Minus,
    Settings2,
    Trash2,
    Copy,
    GripVertical,
} from 'lucide-vue-next';

const props = withDefaults(
    defineProps<{
        field: BuilderField;
        isSelected?: boolean;
    }>(),
    { isSelected: false }
);

const emit = defineEmits<{
    (event: 'select'): void;
    (event: 'delete'): void;
    (event: 'duplicate'): void;
    (event: 'updateField', field: BuilderField): void;
    (event: 'manage'): void;
}>();

/** Gabung perubahan parsial ke salinan field — kartu selalu kirim objek baru (immutable). */
function patch(partial: Partial<BuilderField>): void {
    emit('updateField', { ...props.field, ...partial });
}

/** Perbarui label dari input teks; abaikan event non-input agar tak ada cast target. */
function onLabelInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    patch({ label: event.target.value });
}

/** Perbarui teks bantu dari input teks; abaikan event non-input agar tak ada cast target. */
function onDescriptionInput(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    patch({ description: event.target.value });
}

const hasOptions = computed(() => ['dropdown', 'checkbox', 'radio'].includes(props.field.type));

const TYPE_CONFIG = {
    short_text: { icon: Type, label: 'Teks pendek', tone: 'neutral' },
    long_text: { icon: AlignLeft, label: 'Teks panjang', tone: 'neutral' },
    email: { icon: Mail, label: 'Email', tone: 'info' },
    phone: { icon: Phone, label: 'Telepon', tone: 'info' },
    number: { icon: Hash, label: 'Angka', tone: 'info' },
    dropdown: { icon: ChevronDown, label: 'Dropdown', tone: 'primary' },
    checkbox: { icon: SquareCheck, label: 'Centang', tone: 'primary' },
    radio: { icon: CircleDot, label: 'Pilihan tunggal', tone: 'primary' },
    image_upload: { icon: ImagePlus, label: 'Gambar', tone: 'success' },
    file_upload: { icon: Upload, label: 'File', tone: 'success' },
    date: { icon: Calendar, label: 'Tanggal', tone: 'info' },
    time: { icon: Clock, label: 'Waktu', tone: 'info' },
    rating: { icon: Star, label: 'Rating', tone: 'warning' },
    heading: { icon: HeadingIcon, label: 'Judul', tone: 'neutral' },
    paragraph: { icon: TextCursorInput, label: 'Paragraf', tone: 'neutral' },
    divider: { icon: Minus, label: 'Pemisah', tone: 'neutral' },
} as const;

/** Aksen kecil per kategori field — berbasis tone token proyek, bukan warna acak. */
const FIELD_TONE_CLASSES: Record<'neutral' | 'info' | 'primary' | 'success' | 'warning', string> = {
    neutral: 'text-muted-foreground',
    info: 'text-info',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
};

/** Konfigurasi tampilan untuk sebuah tipe field; fallback short_text bila tipe tak dikenal. */
function fieldTypeConfig(fieldType: string): (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG] {
    for (const [key, entry] of Object.entries(TYPE_CONFIG)) {
        if (key === fieldType) return entry;
    }
    return TYPE_CONFIG.short_text;
}

const config = computed(() => fieldTypeConfig(props.field.type));

/** Petunjuk di kanvas bila admin belum mengisi placeholder — hanya tampilan, bukan nilai tersimpan. */
function canvasPlaceholder(f: BuilderField): string {
    const custom = String(f.placeholder ?? '').trim();
    if (custom) return custom;
    const byType: Record<string, string> = {
        short_text: 'Ketik jawaban singkat…',
        long_text: 'Tulis jawaban di sini…',
        email: 'nama@email.com',
        phone: 'Nomor WhatsApp / telepon',
        number: 'Masukkan angka',
    };
    return byType[f.type] ?? 'Ketik di sini…';
}

/** Jumlah bintang tampil; nilai metadata dipakai apa adanya agar rentang v-for mempertahankan perilaku lama (Vue dispatch `renderList`, bukan loop `<=`). */
const filledStars = computed(() => props.field.metadata?.maxStars ?? 5);

const choiceOptions = computed((): IFieldOptionEntry[] => {
    const raw = props.field.options;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Option 1', 'Option 2', 'Option 3'].map((label) => ({
        id: label.toLowerCase().replace(/\s+/g, '-'),
        type: 'text',
        label,
    }));
});

function choiceImageSrc(entry: IFieldOptionEntry): string | undefined {
    const src = resolveOptionImagePreviewSrc(entry);
    return src !== '' ? src : undefined;
}
</script>

<template>
    <div
        class="group relative cursor-pointer rounded-2xl border transition-[border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        :class="[
            isSelected
                ? 'border-primary bg-primary/[0.04] shadow-md ring-2 ring-primary/20'
                : 'border-border bg-card shadow-sm hover:border-primary/35 hover:shadow-md',
        ]"
        @click="emit('select')"
    >
        <!-- Type badge + actions bar -->
        <div class="group/head flex items-center gap-2.5 px-4 pt-3.5 sm:px-5">
            <GripVertical
                class="hidden size-3.5 cursor-grab text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/80 lg:block"
                aria-hidden="true"
            />
            <span
                class="inline-flex items-center gap-2 rounded-lg border px-1.5 py-1.5"
                :class="
                    isSelected
                        ? 'border-border/80 bg-background shadow-xs'
                        : 'border-border/80 bg-background/60 shadow-xs group-hover:border-border'
                "
            >
                <component
                    :is="config.icon"
                    class="size-4"
                    :stroke-width="2.25"
                    :class="FIELD_TONE_CLASSES[config.tone]"
                    aria-hidden="true"
                />
            </span>
            <span
                class="min-w-0 truncate text-[11px] font-semibold tracking-wide text-muted-foreground"
                :class="isSelected ? '' : 'text-muted-foreground/85'"
            >
                {{ config.label }}
            </span>
            <div class="ml-auto flex shrink-0 items-center gap-0.5">
                <!-- Aksi langsung (pola sama dengan baris Forms di card event) -->
                <div
                    class="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                >
                    <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-transparent hover:text-primary focus-visible:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        :title="hasOptions ? 'Kelola opsi' : 'Pengaturan'"
                        :aria-label="hasOptions ? 'Kelola opsi' : 'Pengaturan field'"
                        @click.stop="emit('manage')"
                    >
                        <Settings2 class="size-3.5" />
                    </button>
                    <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-transparent hover:text-primary focus-visible:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        title="Gandakan"
                        aria-label="Gandakan field"
                        @click.stop="emit('duplicate')"
                    >
                        <Copy class="size-3.5" />
                    </button>
                    <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-transparent hover:text-destructive focus-visible:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        title="Hapus"
                        aria-label="Hapus field"
                        @click.stop="emit('delete')"
                    >
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Field content -->
        <div class="space-y-3 px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
            <!-- Label -->
            <label class="group/label flex items-center gap-0.5">
                <input
                    :value="field.label"
                    :placeholder="field.required ? 'Label pertanyaan' : 'Label pertanyaan (opsional)'"
                    class="w-full border-0 border-b border-transparent bg-transparent p-0 font-display text-[15px] font-semibold tracking-tight text-foreground transition-colors duration-200 outline-none group-hover/label:border-border placeholder:text-muted-foreground/50 focus:border-primary/60"
                    @input="onLabelInput"
                />
                <span v-if="field.required" class="text-destructive">*</span>
            </label>
            <input
                :value="field.description ?? ''"
                :placeholder="field.description ? '' : 'Teks bantu (opsional)'"
                class="w-full border-0 border-b border-transparent bg-transparent p-0 text-xs leading-relaxed text-muted-foreground transition-colors duration-200 outline-none placeholder:text-muted-foreground/45 hover:border-border/70 focus:border-primary/50"
                @input="onDescriptionInput"
            />

            <!-- Preview by type -->
            <div class="mt-1">
                <!-- Short text / Email / Phone / Number -->
                <div
                    v-if="['short_text', 'email', 'phone', 'number'].includes(field.type)"
                    class="rounded-xl border border-border/70 bg-muted/20 p-1.5"
                >
                    <input
                        :type="
                            field.type === 'email'
                                ? 'email'
                                : field.type === 'phone'
                                  ? 'tel'
                                  : field.type === 'number'
                                    ? 'text'
                                    : 'text'
                        "
                        readonly
                        tabindex="-1"
                        value=""
                        :inputmode="field.type === 'number' ? 'decimal' : undefined"
                        :placeholder="canvasPlaceholder(field)"
                        class="pointer-events-none h-11 w-full rounded-full border border-border/80 bg-background px-4 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/70"
                    />
                </div>

                <!-- Long text -->
                <div
                    v-else-if="field.type === 'long_text'"
                    class="rounded-xl border border-border/70 bg-muted/20 p-1.5"
                >
                    <textarea
                        readonly
                        tabindex="-1"
                        rows="3"
                        :placeholder="canvasPlaceholder(field)"
                        class="pointer-events-none min-h-[4.75rem] w-full resize-none rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70"
                    ></textarea>
                    <div class="mt-4 space-y-2 border-t border-dashed border-border/70 pt-3">
                        <div class="h-2 w-2/3 rounded-full bg-muted/70"></div>
                        <div class="h-2 w-1/2 rounded-full bg-muted/50"></div>
                    </div>
                </div>

                <!-- Dropdown -->
                <div v-else-if="field.type === 'dropdown'" class="space-y-2">
                    <div
                        class="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
                    >
                        <span class="text-sm text-muted-foreground/75">{{
                            String(field.placeholder ?? '').trim() || 'Pilih salah satu…'
                        }}</span>
                        <ChevronDown class="size-4 text-muted-foreground/50" />
                    </div>
                    <div class="space-y-1.5 rounded-xl border border-border/70 bg-card p-2.5">
                        <div
                            v-for="(opt, i) in choiceOptions"
                            :key="opt.id || i"
                            class="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-xs text-foreground/85"
                        >
                            <div
                                v-if="opt.type === 'image' && choiceImageSrc(opt)"
                                class="size-10 shrink-0 overflow-hidden rounded-md border border-border"
                            >
                                <img :src="choiceImageSrc(opt)" alt="" class="size-full object-cover" />
                            </div>
                            <span v-else>{{ optionLabel(opt) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Checkbox -->
                <div v-else-if="field.type === 'checkbox'" class="flex flex-col gap-2">
                    <label
                        v-for="(opt, i) in choiceOptions"
                        :key="opt.id || i"
                        class="flex items-center gap-2.5 text-xs text-foreground/80"
                    >
                        <div
                            class="flex size-4 shrink-0 items-center justify-center rounded border border-input bg-card"
                        ></div>
                        <div
                            v-if="opt.type === 'image' && choiceImageSrc(opt)"
                            class="size-12 shrink-0 overflow-hidden rounded-md border border-border"
                        >
                            <img :src="choiceImageSrc(opt)" alt="" class="size-full object-cover" />
                        </div>
                        <span v-else>{{ optionLabel(opt) }}</span>
                    </label>
                </div>

                <!-- Radio -->
                <div v-else-if="field.type === 'radio'" class="flex flex-col gap-2">
                    <label
                        v-for="(opt, i) in choiceOptions"
                        :key="opt.id || i"
                        class="flex items-center gap-2.5 text-xs text-foreground/80"
                    >
                        <div
                            class="flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-card"
                        ></div>
                        <div
                            v-if="opt.type === 'image' && choiceImageSrc(opt)"
                            class="size-12 shrink-0 overflow-hidden rounded-full border border-border"
                        >
                            <img :src="choiceImageSrc(opt)" alt="" class="size-full object-cover" />
                        </div>
                        <span v-else>{{ optionLabel(opt) }}</span>
                    </label>
                </div>

                <!-- Image upload -->
                <div
                    v-else-if="field.type === 'image_upload'"
                    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-6"
                >
                    <div class="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/8 text-primary">
                        <ImagePlus class="size-5" />
                    </div>
                    <p class="text-xs font-semibold text-muted-foreground">Ketuk atau jatuhkan gambar di sini</p>
                    <p class="mt-0.5 text-[10px] text-muted-foreground/60">PNG, JPG hingga 5 MB</p>
                    <div class="mt-2 flex flex-wrap justify-center gap-1">
                        <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                            >4:3</span
                        >
                        <span class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                            >tengah</span
                        >
                    </div>
                </div>

                <!-- File upload -->
                <div
                    v-else-if="field.type === 'file_upload'"
                    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-6"
                >
                    <div
                        class="mb-2 flex size-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground"
                    >
                        <Upload class="size-5" />
                    </div>
                    <p class="text-xs font-semibold text-muted-foreground">Unggah file di sini</p>
                    <p class="mt-0.5 text-[10px] text-muted-foreground/60">PDF, DOC, XLS hingga 10 MB</p>
                </div>

                <!-- Date -->
                <div v-else-if="field.type === 'date'" class="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                    <input
                        type="text"
                        readonly
                        tabindex="-1"
                        value=""
                        :placeholder="String(field.placeholder ?? '').trim() || 'Pilih tanggal'"
                        class="pointer-events-none h-11 w-full rounded-full border border-border/80 bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/70"
                    />
                </div>

                <!-- Time -->
                <div v-else-if="field.type === 'time'" class="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                    <input
                        type="text"
                        readonly
                        tabindex="-1"
                        value=""
                        :placeholder="String(field.placeholder ?? '').trim() || 'Pilih jam (contoh: 09:30)'"
                        class="pointer-events-none h-11 w-full rounded-full border border-border/80 bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground/70"
                    />
                </div>

                <!-- Rating -->
                <div v-else-if="field.type === 'rating'" class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <!-- Nilai `i` turunan metadata bisa union; koersi eksplisit ke angka. ToNumber(`<=`) === Number(), jadi paritas perilaku terjaga. -->
                        <Star
                            v-for="i in filledStars"
                            :key="i"
                            class="size-6 text-amber-400"
                            :fill="Number(i) <= 3 ? '#fbbf24' : 'none'"
                        />
                    </div>
                    <p class="text-[10px] text-muted-foreground/80">Tap bintang untuk nilai</p>
                </div>

                <!-- Heading -->
                <div v-else-if="field.type === 'heading'">
                    <h3 class="font-display text-lg font-bold text-foreground">
                        {{ field.metadata?.content || 'Judul bagian' }}
                    </h3>
                </div>

                <!-- Paragraph -->
                <div v-else-if="field.type === 'paragraph'">
                    <FormParagraphContent
                        :content="String(field.metadata?.content ?? '')"
                        fallback="Teks penjelasan untuk pengisi form."
                    />
                </div>

                <!-- Divider -->
                <div v-else-if="field.type === 'divider'" class="py-1">
                    <hr class="app-divider" />
                </div>
            </div>
        </div>
    </div>
</template>

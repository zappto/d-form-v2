/**
 * Satu sumber string class shell untuk 5 sheet recruitment (`FormSheet`).
 * Semua token diambil verbatim dari call-site lama; urutan token dinormalkan.
 */

/** Ukuran shell `FormSheet`: `default` (28rem) atau `wide` (52rem). */
export type TFormSheetSize = 'default' | 'wide';

/** Token lebar per ukuran; satu-satunya tempat lebar shell didefinisikan. */
export const FORM_SHEET_WIDTH_CLASS: Record<TFormSheetSize, string> = {
    default: 'sm:w-[28rem]',
    wide: 'sm:w-[52rem]',
};

const FORM_SHEET_CONTENT_PREFIX =
    'inset-y-0 right-0 h-full w-full gap-0 p-0 sm:inset-y-3 sm:right-3 sm:h-[calc(100%-1.5rem)] sm:max-w-[calc(100vw-1.5rem)] sm:rounded-2xl sm:border sm:shadow-xl';

/**
 * Class `SheetContent` untuk `size` terpilih: prefix bersama kanonik + token lebar.
 */
export function formSheetContentClass(size: TFormSheetSize): string {
    return `${FORM_SHEET_CONTENT_PREFIX} ${FORM_SHEET_WIDTH_CLASS[size]}`;
}

/** Class overlay kanonik kelima sheet recruitment: gelap + blur. */
export const FORM_SHEET_OVERLAY_CLASS = 'bg-black/60 backdrop-blur-sm';

/** Class `SheetHeader` kanonik recruitment; urutan token sudah dinormalkan. */
export const FORM_SHEET_HEADER_CLASS = 'border-border/70 shrink-0 space-y-1 border-b py-4 pl-4 pr-12 text-left';

/** Class `SheetFooter` kanonik recruitment; urutan token sudah dinormalkan. */
export const FORM_SHEET_FOOTER_CLASS = 'border-border/70 shrink-0 border-t p-4';

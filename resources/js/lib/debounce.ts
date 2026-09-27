/**
 * Debounce default pipeline autosave (builder/event) dalam milidetik.
 * Dipakai useAutosaveSync dan useBuilderAutosave; dipisah dari draft responden karena konteks penyimpanannya berbeda.
 */
export const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Debounce default draft responden (local storage) dalam milidetik.
 * Dipisah dari AUTOSAVE_DEBOUNCE_MS karena konteks berbeda walau nilainya sengaja sama agar indikator seragam.
 */
export const RESPONDENT_DRAFT_DEBOUNCE_MS = 800;

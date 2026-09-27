import type { ComputedRef, Ref } from 'vue';
import { createContext } from 'reka-ui';

export const SIDEBAR_COOKIE_NAME = 'sidebar_state';
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '3rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

const EDITABLE_SHORTCUT_IGNORE_SELECTOR =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"], .ProseMirror, .dform-tiptap-editor';

/** Lewati toggle sidebar bila pengguna sedang mengetik / mengedit (Ctrl+B = bold di editor). */
export function shouldHandleSidebarKeyboardShortcut(event: KeyboardEvent): boolean {
    if (event.key.toLowerCase() !== SIDEBAR_KEYBOARD_SHORTCUT) return false;
    if (!event.metaKey && !event.ctrlKey) return false;
    if (event.altKey || event.shiftKey) return false;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return true;

    if (target.isContentEditable) return false;

    return target.closest(EDITABLE_SHORTCUT_IGNORE_SELECTOR) === null;
}

export const [useSidebar, provideSidebarContext] = createContext<{
    state: ComputedRef<'expanded' | 'collapsed'>;
    open: Ref<boolean>;
    setOpen: (value: boolean) => void;
    isMobile: Ref<boolean>;
    openMobile: Ref<boolean>;
    setOpenMobile: (value: boolean) => void;
    toggleSidebar: () => void;
}>('Sidebar');

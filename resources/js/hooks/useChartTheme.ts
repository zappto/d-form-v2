import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** Atribut tema di documentElement yang diobservasi kedua chart. */
const THEME_ATTRIBUTE = 'data-theme';

/** Nilai atribut penanda mode gelap. */
const DARK_THEME_VALUE = 'dark';

/** Hasil useChartTheme: flag gelap reaktif untuk palet dan remount chart. */
export interface IChartThemeResult {
    isDark: Ref<boolean>;
}

/** Baca status gelap dari atribut data-theme; dipakai saat mount dan tiap mutasi. */
function readDarkTheme(): boolean {
    return document.documentElement.getAttribute(THEME_ATTRIBUTE) === DARK_THEME_VALUE;
}

/** Samakan flag gelap/terang chart dengan atribut data-theme; observer lepas saat unmount. */
export function useChartTheme(): IChartThemeResult {
    const isDark: Ref<boolean> = ref(false);
    let observer: MutationObserver | null = null;

    /** Salin status tema DOM ke flag; dipanggil saat mount dan tiap mutasi atribut. */
    function syncTheme(): void {
        isDark.value = readDarkTheme();
    }

    onMounted((): void => {
        syncTheme();
        observer = new MutationObserver(syncTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    });

    onBeforeUnmount((): void => {
        observer?.disconnect();
        observer = null;
    });

    return { isDark };
}

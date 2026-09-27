import { describe, expect, it } from 'vitest';
import { baseChartTooltipOptions, chartThemeTokens, type IChartThemeTokens } from '../chartTheme';

/** Palet terang kanonik — dipin byte-identik agar refactor tidak mengubah tampilan chart. */
const LEGACY_LIGHT_TOKENS: IChartThemeTokens = {
    tick: 'oklch(0.46 0.025 255)',
    grid: 'oklch(0.92 0.008 255)',
    tooltipBg: 'oklch(0.18 0.018 255)',
    tooltipFg: 'oklch(0.99 0 0)',
};

describe('chartThemeTokens', () => {
    it('memakai palet terang tanpa argumen', () => {
        expect(chartThemeTokens()).toEqual(LEGACY_LIGHT_TOKENS);
    });

    it('mengembalikan objek segar tiap panggilan', () => {
        expect(chartThemeTokens()).not.toBe(chartThemeTokens());
    });
});

describe('baseChartTooltipOptions', () => {
    it('merakit blok dasar tooltip dari token', () => {
        expect(baseChartTooltipOptions(LEGACY_LIGHT_TOKENS)).toEqual({
            backgroundColor: LEGACY_LIGHT_TOKENS.tooltipBg,
            titleColor: LEGACY_LIGHT_TOKENS.tooltipFg,
            bodyColor: LEGACY_LIGHT_TOKENS.tooltipFg,
            titleFont: { size: 12, weight: '600', family: 'Poppins, sans-serif' },
            bodyFont: { size: 12, family: 'Poppins, sans-serif' },
            padding: 12,
            cornerRadius: 10,
        });
    });

    it('memakai tooltipBg palet sebagai backgroundColor', () => {
        expect(baseChartTooltipOptions(chartThemeTokens()).backgroundColor).toBe(LEGACY_LIGHT_TOKENS.tooltipBg);
    });

    it('memakai 7 kunci dasar', () => {
        const keys = Object.keys(baseChartTooltipOptions(LEGACY_LIGHT_TOKENS)).sort();
        expect(keys).toEqual([
            'backgroundColor',
            'bodyColor',
            'bodyFont',
            'cornerRadius',
            'padding',
            'titleColor',
            'titleFont',
        ]);
    });
});

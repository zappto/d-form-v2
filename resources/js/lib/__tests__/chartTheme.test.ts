import { describe, expect, it } from 'vitest';
import { baseChartTooltipOptions, chartThemeTokens, type IChartThemeTokens } from '../chartTheme';

/** Literal warisan CategoryChart.vue:54-57 = RegistrationChart.vue:56-59; pin anti-drift. */
const LEGACY_LIGHT_TOKENS: IChartThemeTokens = {
    tick: 'oklch(0.46 0.025 255)',
    grid: 'oklch(0.92 0.008 255)',
    tooltipBg: 'oklch(0.18 0.018 255)',
    tooltipFg: 'oklch(0.99 0 0)',
};

/** Literal warisan mode gelap kedua chart; pin anti-drift. */
const LEGACY_DARK_TOKENS: IChartThemeTokens = {
    tick: 'oklch(0.72 0.018 255)',
    grid: 'oklch(0.32 0.02 255)',
    tooltipBg: 'oklch(0.22 0.012 255)',
    tooltipFg: 'oklch(0.96 0.005 255)',
};

/** Font tooltip warisan kedua chart; satu-satunya family yang diizinkan. */
const LEGACY_TOOLTIP_TITLE_FONT = { size: 12, weight: '600', family: 'Poppins, sans-serif' };

/** Font body tooltip warisan kedua chart; pin anti-drift. */
const LEGACY_TOOLTIP_BODY_FONT = { size: 12, family: 'Poppins, sans-serif' };

describe('chartThemeTokens', () => {
    it('mode terang sama byte-identik dengan literal lama kedua chart', () => {
        expect(chartThemeTokens(false)).toEqual(LEGACY_LIGHT_TOKENS);
    });

    it('mode gelap sama byte-identik dengan literal lama kedua chart', () => {
        expect(chartThemeTokens(true)).toEqual(LEGACY_DARK_TOKENS);
    });

    it('terang vs gelap berbeda di tiap kanal agar chart identik per tema', () => {
        const light = chartThemeTokens(false);
        const dark = chartThemeTokens(true);
        expect(dark.tick).not.toBe(light.tick);
        expect(dark.grid).not.toBe(light.grid);
        expect(dark.tooltipBg).not.toBe(light.tooltipBg);
        expect(dark.tooltipFg).not.toBe(light.tooltipFg);
    });
});

describe('baseChartTooltipOptions', () => {
    it('mode terang memetakan token ke blok tooltip warisan kedua chart', () => {
        expect(baseChartTooltipOptions(LEGACY_LIGHT_TOKENS)).toEqual({
            backgroundColor: 'oklch(0.18 0.018 255)',
            titleColor: 'oklch(0.99 0 0)',
            bodyColor: 'oklch(0.99 0 0)',
            titleFont: LEGACY_TOOLTIP_TITLE_FONT,
            bodyFont: LEGACY_TOOLTIP_BODY_FONT,
            padding: 12,
            cornerRadius: 10,
        });
    });

    it('mode gelap memetakan token ke blok tooltip warisan kedua chart', () => {
        expect(baseChartTooltipOptions(LEGACY_DARK_TOKENS)).toEqual({
            backgroundColor: 'oklch(0.22 0.012 255)',
            titleColor: 'oklch(0.96 0.005 255)',
            bodyColor: 'oklch(0.96 0.005 255)',
            titleFont: LEGACY_TOOLTIP_TITLE_FONT,
            bodyFont: LEGACY_TOOLTIP_BODY_FONT,
            padding: 12,
            cornerRadius: 10,
        });
    });

    it('komposisi token + tooltip rantai penuh identik untuk dua tema', () => {
        expect(baseChartTooltipOptions(chartThemeTokens(false)).backgroundColor).toBe(
            LEGACY_LIGHT_TOKENS.tooltipBg,
        );
        expect(baseChartTooltipOptions(chartThemeTokens(true)).backgroundColor).toBe(
            LEGACY_DARK_TOKENS.tooltipBg,
        );
    });
});

describe('chartTheme non-regresi', () => {
    it('hanya tujuh kunci dasar; copy per-chart tetap milik call-site', () => {
        const keys = Object.keys(baseChartTooltipOptions(LEGACY_LIGHT_TOKENS)).sort();
        expect(keys).toEqual(
            ['backgroundColor', 'bodyColor', 'bodyFont', 'cornerRadius', 'padding', 'titleColor', 'titleFont'].sort(),
        );
    });

    it('tiap panggilan objek segar agar mutasi chart tak bocor antar render', () => {
        const first = baseChartTooltipOptions(LEGACY_DARK_TOKENS);
        const second = baseChartTooltipOptions(LEGACY_DARK_TOKENS);
        expect(first).not.toBe(second);
        expect(first.titleFont).not.toBe(second.titleFont);
        expect(chartThemeTokens(true)).not.toBe(chartThemeTokens(true));
    });
});

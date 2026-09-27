import type { FontSpec } from 'chart.js';

/** Warna tick sumbu; dipakai CategoryChart dan RegistrationChart. */
const CHART_TICK_LIGHT = 'oklch(0.46 0.025 255)';

/** Warna grid; dipakai CategoryChart dan RegistrationChart. */
const CHART_GRID_LIGHT = 'oklch(0.92 0.008 255)';

/** Latar tooltip; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_BG_LIGHT = 'oklch(0.18 0.018 255)';

/** Teks tooltip; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_FG_LIGHT = 'oklch(0.99 0 0)';

/** Family font chart dashboard; satu-satunya sumber literal Poppins tooltip. */
const CHART_FONT_FAMILY = 'Poppins, sans-serif';

/** Ukuran font judul tooltip chart dashboard. */
const CHART_TOOLTIP_TITLE_SIZE = 12;

/** Tebal font judul tooltip chart dashboard (CSS menerima string numerik '600'; chart.js hanya mengetik number/label). */
const CHART_TOOLTIP_TITLE_WEIGHT = '600' as FontSpec['weight'];

/** Ukuran font isi tooltip chart dashboard. */
const CHART_TOOLTIP_BODY_SIZE = 12;

/** Padding tooltip chart dashboard. */
const CHART_TOOLTIP_PADDING = 12;

/** Radius sudut tooltip chart dashboard. */
const CHART_TOOLTIP_CORNER_RADIUS = 10;

/** Palet chart dashboard: tick, grid, dan warna tooltip. */
export interface IChartThemeTokens {
    tick: string;
    grid: string;
    tooltipBg: string;
    tooltipFg: string;
}

/** Font judul tooltip chart dashboard — subset `FontSpec` chart.js. */
export type TIChartTooltipTitleFont = Partial<FontSpec>;

/** Font isi tooltip chart dashboard — subset `FontSpec` chart.js. */
export type TIChartTooltipBodyFont = Partial<FontSpec>;

/** Blok dasar tooltip chart dashboard; copy per-chart tetap di call-site. */
export interface IChartTooltipBaseOptions {
    backgroundColor: string;
    titleColor: string;
    bodyColor: string;
    titleFont: TIChartTooltipTitleFont;
    bodyFont: TIChartTooltipBodyFont;
    padding: number;
    cornerRadius: number;
}

/** Palet chart dashboard; satu-satunya sumber literal oklch token. */
export function chartThemeTokens(): IChartThemeTokens {
    return {
        tick: CHART_TICK_LIGHT,
        grid: CHART_GRID_LIGHT,
        tooltipBg: CHART_TOOLTIP_BG_LIGHT,
        tooltipFg: CHART_TOOLTIP_FG_LIGHT,
    };
}

/** Rakit blok dasar tooltip dari token; displayColors/callbacks tetap milik call-site. */
export function baseChartTooltipOptions(dashboardTokens: IChartThemeTokens): IChartTooltipBaseOptions {
    return {
        backgroundColor: dashboardTokens.tooltipBg,
        titleColor: dashboardTokens.tooltipFg,
        bodyColor: dashboardTokens.tooltipFg,
        titleFont: {
            size: CHART_TOOLTIP_TITLE_SIZE,
            weight: CHART_TOOLTIP_TITLE_WEIGHT,
            family: CHART_FONT_FAMILY,
        },
        bodyFont: { size: CHART_TOOLTIP_BODY_SIZE, family: CHART_FONT_FAMILY },
        padding: CHART_TOOLTIP_PADDING,
        cornerRadius: CHART_TOOLTIP_CORNER_RADIUS,
    };
}

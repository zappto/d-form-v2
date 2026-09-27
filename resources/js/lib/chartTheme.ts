/** Warna tick sumbu mode terang; dipakai CategoryChart dan RegistrationChart. */
const CHART_TICK_LIGHT = 'oklch(0.46 0.025 255)';

/** Warna tick sumbu mode gelap; dipakai CategoryChart dan RegistrationChart. */
const CHART_TICK_DARK = 'oklch(0.72 0.018 255)';

/** Warna grid mode terang; dipakai CategoryChart dan RegistrationChart. */
const CHART_GRID_LIGHT = 'oklch(0.92 0.008 255)';

/** Warna grid mode gelap; dipakai CategoryChart dan RegistrationChart. */
const CHART_GRID_DARK = 'oklch(0.32 0.02 255)';

/** Latar tooltip mode terang; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_BG_LIGHT = 'oklch(0.18 0.018 255)';

/** Latar tooltip mode gelap; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_BG_DARK = 'oklch(0.22 0.012 255)';

/** Teks tooltip mode terang; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_FG_LIGHT = 'oklch(0.99 0 0)';

/** Teks tooltip mode gelap; dipakai CategoryChart dan RegistrationChart. */
const CHART_TOOLTIP_FG_DARK = 'oklch(0.96 0.005 255)';

/** Family font chart dashboard; satu-satunya sumber literal Poppins tooltip. */
const CHART_FONT_FAMILY = 'Poppins, sans-serif';

/** Ukuran font judul tooltip chart dashboard. */
const CHART_TOOLTIP_TITLE_SIZE = 12;

/** Tebal font judul tooltip chart dashboard. */
const CHART_TOOLTIP_TITLE_WEIGHT = '600';

/** Ukuran font isi tooltip chart dashboard. */
const CHART_TOOLTIP_BODY_SIZE = 12;

/** Padding tooltip chart dashboard. */
const CHART_TOOLTIP_PADDING = 12;

/** Radius sudut tooltip chart dashboard. */
const CHART_TOOLTIP_CORNER_RADIUS = 10;

/** Palet terang/gelap chart dashboard: tick, grid, dan warna tooltip. */
export interface IChartThemeTokens {
    tick: string;
    grid: string;
    tooltipBg: string;
    tooltipFg: string;
}

/** Font judul tooltip chart dashboard. */
export interface IChartTooltipTitleFont {
    size: number;
    weight: string;
    family: string;
}

/** Font isi tooltip chart dashboard. */
export interface IChartTooltipBodyFont {
    size: number;
    family: string;
}

/** Blok dasar tooltip chart dashboard; copy per-chart tetap di call-site. */
export interface IChartTooltipBaseOptions {
    backgroundColor: string;
    titleColor: string;
    bodyColor: string;
    titleFont: IChartTooltipTitleFont;
    bodyFont: IChartTooltipBodyFont;
    padding: number;
    cornerRadius: number;
}

/** Petakan flag gelap ke palet chart; satu-satunya sumber literal oklch token. */
export function chartThemeTokens(isDark: boolean): IChartThemeTokens {
    return {
        tick: isDark ? CHART_TICK_DARK : CHART_TICK_LIGHT,
        grid: isDark ? CHART_GRID_DARK : CHART_GRID_LIGHT,
        tooltipBg: isDark ? CHART_TOOLTIP_BG_DARK : CHART_TOOLTIP_BG_LIGHT,
        tooltipFg: isDark ? CHART_TOOLTIP_FG_DARK : CHART_TOOLTIP_FG_LIGHT,
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

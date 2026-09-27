export type Tone = 'primary' | 'success' | 'warning' | 'destructive' | 'neutral' | 'info';

export type TSurface = 'base' | 'soft' | 'tinted';

export type TRadiusToken = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type TShadowToken = 'none' | 'xs' | 'sm';

export type GapToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IToneStyle {
    readonly border: string;
    readonly background: string;
    readonly text: string;
}

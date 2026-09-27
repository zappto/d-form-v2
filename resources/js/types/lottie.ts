export interface ILottieRegistryEntry {
    readonly src: string;
    readonly label: string;
}

export type TLottieRegistry = Readonly<Record<string, ILottieRegistryEntry>>;

export interface ILocalLottieProps {
    readonly name?: string;
    readonly src?: string;
    readonly animationLink?: string;
    readonly height?: number | string;
    readonly width?: number | string;
    readonly loop?: boolean | number;
    readonly autoPlay?: boolean;
    readonly speed?: number;
    readonly lazy?: boolean;
}

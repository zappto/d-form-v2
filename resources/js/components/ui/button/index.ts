import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-foreground text-sm font-extrabold tracking-tight shadow-[4px_4px_0_var(--brutal-ink)] transition-all duration-150 outline-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--brutal-ink)] disabled:pointer-events-none disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_var(--brutal-ink)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-ring/60 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-(--brutal-yellow) hover:text-foreground',
                destructive:
                    'bg-destructive text-white hover:bg-(--brutal-orange) hover:text-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                outline: 'bg-background text-foreground hover:bg-(--brutal-mint)',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-(--brutal-lilac)',
                ghost: 'border-transparent bg-transparent shadow-none hover:border-foreground hover:bg-accent hover:shadow-[4px_4px_0_var(--brutal-ink)]',
                link: 'border-transparent bg-transparent text-primary shadow-none underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-9 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5',
                lg: 'h-12 rounded-2xl px-6 has-[>svg]:px-4',
                icon: 'size-10',
                'icon-sm': 'size-9 rounded-lg',
                'icon-lg': 'size-12 rounded-2xl',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;

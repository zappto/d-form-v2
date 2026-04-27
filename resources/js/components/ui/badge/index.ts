import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-2 border-foreground px-2.5 py-0.5 text-xs font-extrabold shadow-[2px_2px_0_var(--brutal-ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary:
          "bg-(--brutal-yellow) text-secondary-foreground",
        destructive:
          "bg-destructive text-white",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

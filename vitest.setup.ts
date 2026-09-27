import { vi } from 'vitest'

/**
 * `EmptyState` renders `LocalLottie` → `vue3-lottie` → `lottie-web`, whose player grabs a 2D canvas
 * context as soon as it is imported; jsdom has none, so every suite importing such a component fails
 * to collect. Only the player is stubbed here — application components stay real.
 */
vi.mock('vue3-lottie', () => ({
    Vue3Lottie: { template: '<div />' },
}))

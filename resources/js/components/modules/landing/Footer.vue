<template>
    <footer class="border-t-4 border-[#101014] bg-[#101014] pt-16 pb-8">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="grid gap-12 lg:grid-cols-5">
                <!-- Brand -->
                <div class="lg:col-span-1">
                    <a href="/" class="inline-flex items-center gap-2.5">
                        <div class="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-[#0A84DC] shadow-[4px_4px_0_#FFD84D]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                <path d="M14 2v6h6" />
                            </svg>
                        </div>
                        <span class="font-display text-2xl font-extrabold text-white">
                            D<span class="text-[#0A84DC]">Form</span>
                        </span>
                    </a>
                    <p class="mt-5 max-w-xs text-sm leading-relaxed font-semibold text-white/70">
                        The modern platform for event organizers.
                        Create forms, manage events, collect responses.
                    </p>
                    <!-- Social links -->
                    <div class="mt-6 flex gap-3">
                        <a v-for="social in ['twitter', 'github', 'linkedin']" :key="social" href="#" class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-white text-[#101014] shadow-[3px_3px_0_#FFD84D] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#41F0B4]">
                            <svg v-if="social === 'twitter'" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <svg v-if="social === 'github'" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                            </svg>
                            <svg v-if="social === 'linkedin'" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Product -->
                <div>
                    <h4 class="mb-4 w-fit rounded-full border-2 border-white bg-[#FFD84D] px-3 py-1 text-xs font-extrabold tracking-wider text-[#101014] uppercase">Product</h4>
                    <ul class="space-y-3">
                        <li><a href="/features" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FFD84D]">Features</a></li>
                        <li><a href="/events" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FFD84D]">Events</a></li>
                        <li><a href="/docs" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FFD84D]">Documentation</a></li>
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FFD84D]">Changelog</a></li>
                    </ul>
                </div>

                <!-- Resources -->
                <div>
                    <h4 class="mb-4 w-fit rounded-full border-2 border-white bg-[#41F0B4] px-3 py-1 text-xs font-extrabold tracking-wider text-[#101014] uppercase">Resources</h4>
                    <ul class="space-y-3">
                        <li><a href="/docs" class="text-sm font-bold text-white/70 transition-colors hover:text-[#41F0B4]">Documentation</a></li>
                        <li><a href="/docs" class="text-sm font-bold text-white/70 transition-colors hover:text-[#41F0B4]">API Reference</a></li>
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#41F0B4]">Blog</a></li>
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#41F0B4]">Community</a></li>
                    </ul>
                </div>

                <!-- Legal -->
                <div>
                    <h4 class="mb-4 w-fit rounded-full border-2 border-white bg-[#FF6BB5] px-3 py-1 text-xs font-extrabold tracking-wider text-[#101014] uppercase">Legal</h4>
                    <ul class="space-y-3">
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FF6BB5]">Privacy Policy</a></li>
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FF6BB5]">Terms of Service</a></li>
                        <li><a href="#" class="text-sm font-bold text-white/70 transition-colors hover:text-[#FF6BB5]">Cookie Policy</a></li>
                    </ul>
                </div>

                <!-- Location & Map -->
                <div>
                    <h4 class="mb-4 w-fit rounded-full border-2 border-white bg-[#B9A4FF] px-3 py-1 text-xs font-extrabold tracking-wider text-[#101014] uppercase">Location</h4>
                    <p class="mb-4 text-sm leading-relaxed font-semibold text-white/70">
                        Gedung D, Universitas Dian Nuswantoro,<br/>
                        Jl. Imam Bonjol No.207, Semarang,<br/>
                        Jawa Tengah 50131
                    </p>
                    <div class="overflow-hidden rounded-2xl border-2 border-white shadow-[5px_5px_0_#FFD84D]">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d989.3799178855791!2d110.41887866961944!3d-6.981927599999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e708b4ec2e4fd47%3A0x8139e2febbcaf3aa!2sGedung%20D%20Universitas%20Dian%20Nuswantoro!5e0!3m2!1sid!2sid!4v1712112000000!5m2!1sid!2sid"
                            width="100%"
                            height="160"
                            style="border:0; filter: saturate(1.4) contrast(1.05);"
                            allowfullscreen=""
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            </div>

            <!-- Bottom bar -->
            <div class="mt-16 border-t-2 border-white pt-8">
                <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p class="text-xs font-bold text-white/60">
                        &copy; {{ new Date().getFullYear() }} DForm. All rights reserved.
                    </p>
                    <p class="text-xs font-bold text-white/60">
                        Made with <span class="text-[#FFD84D]">♥</span> by Doscom
                    </p>
                </div>
            </div>
        </div>
    </footer>
</template>

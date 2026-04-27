<template>
    <div class="relative hidden overflow-hidden border-r-4 border-[#101014] bg-[#0A84DC] lg:flex lg:flex-col lg:items-center lg:justify-center">
        <!-- Dot grid -->
        <div class="brutal-grid pointer-events-none absolute inset-0 opacity-[0.08]"></div>
        <div class="pointer-events-none absolute inset-0 opacity-[0.08]">
            <svg width="100%" height="100%">
                <defs>
                    <pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="0.8" fill="white" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#auth-dots)" />
            </svg>
        </div>
        <div class="absolute top-10 left-10 h-24 w-24 -rotate-12 rounded-3xl border-4 border-[#101014] bg-[#FFD84D]"></div>
        <div class="absolute right-12 bottom-16 h-28 w-28 rounded-full border-4 border-[#101014] bg-[#FF6BB5]"></div>

        <!-- Illustration SVG -->
        <div class="relative z-10 mx-auto w-full max-w-md px-12">
            <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full">
                <defs>
                    <filter id="as" x="-8%" y="-8%" width="116%" height="124%">
                        <feDropShadow dx="8" dy="8" stdDeviation="0" flood-color="#101014" flood-opacity="1" />
                    </filter>
                </defs>

                <!-- Main card -->
                <g filter="url(#as)">
                    <rect x="40" y="30" width="320" height="300" rx="22" fill="white" stroke="#101014" stroke-width="5" />
                    <rect x="40" y="30" width="320" height="50" rx="22" fill="#FFD84D" stroke="#101014" stroke-width="5" />
                    <rect x="40" y="72" width="320" height="8" fill="#FFD84D" />
                    <circle cx="66" cy="56" r="6" fill="#FF6BB5" stroke="#101014" stroke-width="2" />
                    <circle cx="86" cy="56" r="6" fill="#41F0B4" stroke="#101014" stroke-width="2" />
                    <circle cx="106" cy="56" r="6" fill="#0A84DC" stroke="#101014" stroke-width="2" />

                    <!-- Lock icon -->
                    <circle cx="200" cy="115" r="24" fill="#41F0B4" stroke="#101014" stroke-width="4" />
                    <rect x="190" y="108" width="20" height="16" rx="3" fill="none" stroke="#101014" stroke-width="2.5" />
                    <path d="M194 108v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#101014" stroke-width="2.5" stroke-linecap="round" />
                    <circle cx="200" cy="116" r="2.5" fill="#101014" />

                    <!-- Form fields -->
                    <rect x="80" y="150" width="240" height="24" rx="8" fill="white" stroke="#101014" stroke-width="3" />
                    <rect x="92" y="158" width="80" height="8" rx="4" fill="#101014" opacity="0.45" />
                    <rect x="80" y="184" width="240" height="24" rx="8" fill="white" stroke="#101014" stroke-width="3" />
                    <rect x="92" y="192" width="58" height="8" rx="4" fill="#101014" opacity="0.45" />
                    <circle cx="304" cy="196" r="5" fill="#FF6BB5" stroke="#101014" stroke-width="2" />

                    <!-- Button -->
                    <rect x="80" y="224" width="240" height="32" rx="10" fill="#0A84DC" stroke="#101014" stroke-width="3" class="auth-btn" />
                    <rect x="165" y="236" width="70" height="8" rx="4" fill="white" />

                    <!-- Divider -->
                    <line x1="80" y1="272" x2="150" y2="272" stroke="#101014" stroke-width="2" />
                    <text x="170" y="276" font-size="8" fill="#101014" font-weight="800" font-family="system-ui" text-anchor="middle">or</text>
                    <line x1="190" y1="272" x2="320" y2="272" stroke="#101014" stroke-width="2" />

                    <!-- Social buttons -->
                    <rect x="80" y="286" width="115" height="28" rx="8" fill="#FFD84D" stroke="#101014" stroke-width="3" />
                    <circle cx="100" cy="300" r="6" fill="#EA4335" opacity="0.25" />
                    <text x="98" y="292" font-size="6" fill="#EA4335" font-weight="800" font-family="system-ui">G</text>
                    <rect x="112" y="296" width="60" height="7" rx="3.5" fill="#101014" opacity="0.55" />

                    <rect x="205" y="286" width="115" height="28" rx="8" fill="#B9A4FF" stroke="#101014" stroke-width="3" />
                    <circle cx="225" cy="300" r="6" fill="#111827" opacity="0.15" />
                    <text x="221" y="303" font-size="6" fill="#111827" font-weight="800" font-family="system-ui">GH</text>
                    <rect x="237" y="296" width="60" height="7" rx="3.5" fill="#101014" opacity="0.55" />
                </g>

                <!-- Floating elements -->
                <g class="auth-float-1">
                    <rect x="0" y="60" width="58" height="40" rx="12" fill="#FFD84D" stroke="#101014" stroke-width="4" />
                    <circle cx="18" cy="80" r="6" fill="#FF6BB5" stroke="#101014" stroke-width="2" />
                    <rect x="30" y="76" width="20" height="6" rx="3" fill="#101014" />
                </g>
                <g class="auth-float-2">
                    <rect x="350" y="180" width="50" height="38" rx="12" fill="#41F0B4" stroke="#101014" stroke-width="4" />
                    <circle cx="382" cy="199" r="9" fill="white" stroke="#101014" stroke-width="3" />
                    <path d="M378 199l3 3 6-6" stroke="#101014" stroke-width="2" stroke-linecap="round" />
                </g>

                <!-- Cursor -->
                <g class="auth-cursor">
                    <path d="M168 184l22 60 13-28 29 20 12-18-30-20 27-14-73-20z" fill="#FFD84D" stroke="#101014" stroke-width="4" stroke-linejoin="round" />
                </g>
            </svg>
        </div>

        <!-- Bottom text -->
        <div class="relative z-10 mt-10 text-center">
            <p class="font-display text-3xl font-extrabold text-white drop-shadow-[4px_4px_0_#101014]">DForm Platform</p>
            <p class="mt-2 rounded-full border-2 border-[#101014] bg-white px-4 py-2 text-sm font-extrabold text-[#101014] shadow-[4px_4px_0_#101014]">
                Created by Dinus Open Source Community
            </p>
        </div>
    </div>
</template>

<style scoped>
.auth-float-1 { animation: authF1 6s ease-in-out infinite; }
.auth-float-2 { animation: authF2 7s ease-in-out infinite; }
@keyframes authF1 { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-8px) translateX(4px); } }
@keyframes authF2 { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-6px) translateX(-4px); } }

.auth-cursor { animation: authC 8s ease-in-out infinite; }
@keyframes authC { 0%,100% { transform: translate(0, 0); } 25% { transform: translate(60px, -30px); } 50% { transform: translate(100px, 20px); } 75% { transform: translate(-20px, 10px); } }

.auth-btn { animation: authBP 4s ease-in-out infinite; }
@keyframes authBP { 0%,100% { opacity: 1; } 50% { opacity: 0.85; } }
</style>

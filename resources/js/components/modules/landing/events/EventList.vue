<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const listVisible = ref(false);
onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) listVisible.value = true; },
        { threshold: 0.05 }
    );
    const el = document.getElementById('event-list');
    if (el) observer.observe(el);
});

const events = [
    { id: 1, title: 'Design Systems Workshop', date: 'Apr 20, 2026', location: 'Online', attendees: 342, category: 'Workshop', status: 'Open', color: '#0A84DC', image: '/images/events/design-workshop.png' },
    { id: 2, title: 'Startup Pitch Night', date: 'Apr 25, 2026', location: 'Semarang', attendees: 189, category: 'Networking', status: 'Open', color: '#7C3AED', image: '/images/events/startup-networking.png' },
    { id: 3, title: 'AI & Machine Learning Summit', date: 'May 5, 2026', location: 'Bandung', attendees: 1205, category: 'Conference', status: 'Open', color: '#059669', image: '/images/events/ai-summit.png' },
    { id: 4, title: 'UX Research Bootcamp', date: 'May 10, 2026', location: 'Online', attendees: 567, category: 'Bootcamp', status: 'Open', color: '#D97706', image: '/images/events/design-workshop.png' },
    { id: 5, title: 'Open Source Meetup', date: 'May 22, 2026', location: 'Yogyakarta', attendees: 156, category: 'Meetup', status: 'Open', color: '#DC2626', image: '/images/events/hackathon.png' },
    { id: 6, title: 'Cloud Architecture Day', date: 'Jun 1, 2026', location: 'Surabaya', attendees: 890, category: 'Conference', status: 'Coming Soon', color: '#0891B2', image: '/images/events/cloud-architecture.png' },
    { id: 7, title: 'Product Management Forum', date: 'Jun 8, 2026', location: 'Online', attendees: 423, category: 'Forum', status: 'Coming Soon', color: '#DB2777', image: '/images/events/startup-networking.png' },
    { id: 8, title: 'Hackathon: Code for Good', date: 'Jun 15, 2026', location: 'Jakarta', attendees: 300, category: 'Hackathon', status: 'Coming Soon', color: '#0D9488', image: '/images/events/hackathon.png' },
];

const searchQuery = ref('');
const activeCategory = ref('All');

const categories = computed(() => {
    const cats = [...new Set(events.map(e => e.category))];
    return ['All', ...cats];
});

const filteredEvents = computed(() => {
    let result = events;
    if (activeCategory.value !== 'All') {
        result = result.filter(e => e.category === activeCategory.value);
    }
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
        );
    }
    return result;
});
</script>

<template>
    <section id="event-list" class="relative overflow-hidden bg-background py-20 lg:py-28">
        <div class="absolute right-8 top-10 h-24 w-24 rotate-12 rounded-full border-4 border-[#101014] bg-[#41F0B4]"></div>
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <!-- Header + Search -->
            <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 class="font-display text-4xl font-extrabold tracking-[-0.04em] text-[#101014]">All Events</h2>
                <div class="flex items-center gap-3 rounded-2xl border-2 border-[#101014] bg-white px-4 py-2.5 shadow-[4px_4px_0_#101014] transition-all focus-within:-translate-x-0.5 focus-within:-translate-y-0.5">
                    <svg class="h-4 w-4 text-[#101014]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search events..."
                        class="w-full min-w-[200px] border-0 bg-transparent text-sm font-bold text-[#101014] shadow-none placeholder-[#6B7280] outline-none"
                    />
                </div>
            </div>

            <!-- Category Tabs -->
            <div class="mb-10 flex flex-wrap gap-2">
                <button
                    v-for="cat in categories" :key="cat"
                    @click="activeCategory = cat"
                    :class="[
                        'rounded-xl border-2 border-[#101014] px-4 py-2 text-xs font-extrabold shadow-[3px_3px_0_#101014] transition-all duration-200 active:translate-x-1 active:translate-y-1 active:shadow-none',
                        activeCategory === cat
                            ? 'bg-[#0A84DC] text-white'
                            : 'bg-white text-[#101014] hover:bg-[#FFD84D]',
                    ]"
                >
                    {{ cat }}
                </button>
            </div>

            <!-- Event Grid -->
            <div v-if="filteredEvents.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <a
                    v-for="(event, i) in filteredEvents" :key="event.id"
                    :href="`/events/${event.id}`"
                    :class="[
                        'brutal-card group flex flex-col overflow-hidden transition-all duration-300',
                        listVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
                    ]"
                    :style="{ transitionDelay: `${i * 60}ms` }"
                >
                    <!-- Card Image -->
                    <div class="relative aspect-[16/10] overflow-hidden">
                        <img :src="event.image" :alt="event.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        <span :class="['absolute top-3 right-3 rounded-lg border-2 border-[#101014] bg-white px-2 py-0.5 text-[10px] font-extrabold shadow-[2px_2px_0_#101014]', event.status === 'Open' ? 'text-[#059669]' : 'text-[#D97706]']">
                            {{ event.status }}
                        </span>
                    </div>
                    <!-- Card Content -->
                    <div class="flex flex-1 flex-col p-5">
                        <span class="mb-3 w-fit rounded-lg border-2 border-[#101014] bg-[#FFD84D] px-2 py-0.5 text-[10px] font-extrabold text-[#101014] shadow-[2px_2px_0_#101014]">
                            {{ event.category }}
                        </span>
                        <h3 class="font-display mb-2 text-base font-extrabold text-[#101014] transition-colors group-hover:text-[#0A84DC]">{{ event.title }}</h3>
                        <div class="mt-auto space-y-1.5 pt-3 text-[11px] font-bold text-[#34343B]">
                            <div class="flex items-center gap-1.5">
                                <svg class="h-3 w-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                                {{ event.date }}
                            </div>
                            <div class="flex items-center gap-1.5">
                                <svg class="h-3 w-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                {{ event.location }}
                            </div>
                            <div class="flex items-center gap-1.5">
                                <svg class="h-3 w-3 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                {{ event.attendees.toLocaleString() }} attendees
                            </div>
                        </div>
                    </div>
                </a>
            </div>

            <!-- Empty state -->
            <div v-else class="flex flex-col items-center justify-center py-20 text-center">
                <svg class="mb-4 h-12 w-12 text-[#101014]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <p class="font-display text-lg font-extrabold text-[#101014]">No events found</p>
                <p class="mt-1 text-sm font-semibold text-[#34343B]">Try adjusting your search or filter.</p>
            </div>
        </div>
    </section>
</template>

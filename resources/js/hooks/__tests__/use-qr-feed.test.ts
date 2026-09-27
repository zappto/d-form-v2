import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useQrFeed, type IQrFeedControls } from '../useQrFeed';

/** Bangun respons axios penuh dari payload agar pengetikan mock tetap ketat. */
function axiosOk(data: unknown): AxiosResponse {
    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
    };
}

/** Host tipis agar siklus hidup hook feed berjalan seperti di halaman. */
function mountFeedHost(): { feed: () => IQrFeedControls; wrapper: ReturnType<typeof mount> } {
    let feed: IQrFeedControls | null = null;
    const host = defineComponent({
        setup() {
            feed = useQrFeed({ storeUrl: '/scan-store', feedUrl: '/scan-feed' });
            return () => h('div', 'host');
        },
    });
    const wrapper = mount(host);
    return {
        feed: (): IQrFeedControls => {
            if (feed === null) {
                throw new Error('hook feed belum terpasang');
            }

            return feed;
        },
        wrapper,
    };
}

describe('useQrFeed', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.spyOn(axios, 'get').mockResolvedValue(axiosOk({ rows: [], cursor: '' }));
        vi.spyOn(axios, 'post').mockResolvedValue(
            axiosOk({
                type: 'event',
                eventTitle: 'Demo',
                attendee: { name: 'Ana', email: 'ana@example.id' },
                status: 'success',
                scannedAt: new Date().toISOString(),
            })
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        sessionStorage.clear();
    });

    it('desk id bertahan via sessionStorage antar pemasangan', () => {
        const first = mountFeedHost();
        const deskId = first.feed().deskId;
        expect(deskId.length).toBeGreaterThan(0);
        expect(sessionStorage.getItem('scan-desk-id')).toBe(deskId);
        first.wrapper.unmount();

        const second = mountFeedHost();
        try {
            expect(second.feed().deskId).toBe(deskId);
        } finally {
            second.wrapper.unmount();
        }
    });

    it('cooldown 2000 menahan hasil ganda dari kode yang sama', async () => {
        vi.useFakeTimers();
        const { feed, wrapper } = mountFeedHost();
        try {
            const postSpy = vi.mocked(axios.post);

            async function attemptScan(): Promise<void> {
                if (feed().acceptScanInput('CODE-1')) {
                    await feed().submitScan({ raw: 'CODE-1', source: 'camera' });
                }
            }

            await attemptScan();
            expect(postSpy).toHaveBeenCalledTimes(1);
            expect(feed().scanHistory.value.length).toBe(1);

            await attemptScan();
            expect(postSpy).toHaveBeenCalledTimes(1);
            expect(feed().scanHistory.value.length).toBe(1);

            vi.advanceTimersByTime(2000);
            expect(feed().acceptScanInput('CODE-1')).toBe(true);
        } finally {
            wrapper.unmount();
        }
    });

    it('poll memakai interval 2000 dan timeout 8000', async () => {
        vi.useFakeTimers();
        const getSpy = vi.mocked(axios.get);
        getSpy.mockResolvedValue(
            axiosOk({
                rows: [
                    {
                        id: 'feed-1',
                        ts: new Date().toISOString(),
                        type: 'event',
                        eventTitle: 'Demo',
                        name: 'Budi',
                        identifier: 'budi@example.id',
                        queueNumber: null,
                    },
                ],
                cursor: 'c1',
            })
        );

        const { feed, wrapper } = mountFeedHost();
        try {
            await vi.advanceTimersByTimeAsync(0);
            expect(getSpy).toHaveBeenCalledTimes(1);
            expect(getSpy.mock.calls[0]?.[1]).toMatchObject({ timeout: 8000 });

            await vi.advanceTimersByTimeAsync(2000);
            expect(getSpy).toHaveBeenCalledTimes(2);

            await vi.advanceTimersByTimeAsync(2000);
            expect(getSpy).toHaveBeenCalledTimes(3);
            expect(feed().scanHistory.value.length).toBe(1);
        } finally {
            wrapper.unmount();
        }
    });
});

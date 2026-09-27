import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useQrFeed, type IQrFeedControls } from '../useQrFeed';

const toastSpies = vi.hoisted(() => ({
    callable: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
    toast: Object.assign(toastSpies.callable, {
        success: toastSpies.success,
        error: toastSpies.error,
        warning: toastSpies.warning,
        info: toastSpies.info,
    }),
}));

const toastSuccess = toastSpies.success;
const toastError = toastSpies.error;
const toastWarning = toastSpies.warning;

/** Bangun respons axios penuh dari payload agar pengetikan mock tetap ketat. */
function axiosOk<TData>(data: TData): AxiosResponse<TData> {
    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() },
    };
}

/** Bangun kegagalan axios berstatus + body agar cabang error submitScan teruji nyata. */
function axiosFailure(status: number, data: unknown): AxiosError {
    return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
        data,
        status,
        statusText: 'Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
    });
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
        toastSpies.callable.mockReset();
        toastSpies.success.mockReset();
        toastSpies.error.mockReset();
        toastSpies.warning.mockReset();
        toastSpies.info.mockReset();
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

    describe('submitScan', () => {
        it('menolak kode kosong tanpa memanggil POST', async () => {
            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: '   ', source: 'manual' });

                expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
                expect(toastError).toHaveBeenCalledTimes(1);
                expect(toastError.mock.calls[0]?.[0]).toBe('Isi kode registrasi terlebih dahulu.');
            } finally {
                wrapper.unmount();
            }
        });

        it('kunci ganda: panggilan kedua saat sibuk diabaikan', async () => {
            const pending: { resolve: ((value: AxiosResponse<unknown>) => void) | null } = { resolve: null };
            vi.mocked(axios.post).mockImplementation(
                () =>
                    new Promise<AxiosResponse<unknown>>((resolve) => {
                        pending.resolve = resolve;
                    })
            );

            const { feed, wrapper } = mountFeedHost();
            try {
                const first = feed().submitScan({ raw: 'CODE-1', source: 'manual' });
                await feed().submitScan({ raw: 'CODE-2', source: 'manual' });

                expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);

                pending.resolve?.(
                    axiosOk({
                        type: 'event',
                        eventTitle: 'Demo',
                        attendee: { name: 'Ana', email: 'ana@example.id' },
                        status: 'success',
                        scannedAt: new Date().toISOString(),
                    })
                );
                await first;

                expect(feed().scanHistory.value).toHaveLength(1);
            } finally {
                wrapper.unmount();
            }
        });

        it('sukses event: riwayat bertambah lalu toast sukses tampil', async () => {
            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-1', source: 'camera' });

                expect(feed().scanResult.value?.status).toBe('success');
                expect(feed().scanResult.value?.email).toBe('ana@example.id');
                expect(feed().scanResult.value?.rawCode).toBe('CODE-1');
                expect(feed().scanHistory.value).toHaveLength(1);
                expect(toastSuccess).toHaveBeenCalledWith('Ana', {
                    description: 'Boleh masuk — tiket dikirim ke email',
                });
            } finally {
                wrapper.unmount();
            }
        });

        it('sukses oprec: email memakai nomor registrasi dan antrean di-pad', async () => {
            vi.mocked(axios.post).mockResolvedValue(
                axiosOk({
                    type: 'recruitment',
                    eventTitle: '2026-10-01T09:00:00Z',
                    attendee: { name: 'Budi', registration_number: 'REG-7', queue_number: 5 },
                    status: 'success',
                    scannedAt: new Date().toISOString(),
                })
            );

            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-2', source: 'manual' });

                expect(feed().scanResult.value?.eventKind).toBe('oprec');
                expect(feed().scanResult.value?.email).toBe('REG-7');
                expect(feed().scanResult.value?.queueNumber).toBe(5);
                expect(feed().scanResult.value?.eventTitle).toBe('2026-10-01');
                expect(toastSuccess).toHaveBeenCalledWith('Budi', {
                    description: '#05 — arahkan ke ruang tunggu',
                });
            } finally {
                wrapper.unmount();
            }
        });

        it('409 oprec: catat hasil duplikat sebelum toast peringatan', async () => {
            vi.mocked(axios.post).mockRejectedValue(
                axiosFailure(409, {
                    message: 'Sudah check-in',
                    type: 'recruitment',
                    eventTitle: 'Demo',
                    attendee: { name: 'Budi', registration_number: 'REG-7', queue_number: 7 },
                })
            );

            const { feed, wrapper } = mountFeedHost();
            try {
                let statusWhenToasted: string | null = null;
                toastWarning.mockImplementation(() => {
                    statusWhenToasted = feed().scanResult.value?.status ?? null;
                });

                await feed().submitScan({ raw: 'CODE-2', source: 'camera' });

                expect(feed().scanResult.value?.status).toBe('already');
                expect(feed().scanResult.value?.queueNumber).toBe(7);
                expect(feed().scanHistory.value[0]?.name).toBe('Budi');
                expect(toastWarning).toHaveBeenCalledWith('Sudah check-in', { description: 'Budi · REG-7' });
                expect(statusWhenToasted).toBe('already');
            } finally {
                wrapper.unmount();
            }
        });

        it('409 event: pakai email attendee pada deskripsi peringatan', async () => {
            vi.mocked(axios.post).mockRejectedValue(
                axiosFailure(409, {
                    message: 'Sudah check-in',
                    type: 'event',
                    eventTitle: 'Demo',
                    attendee: { name: 'Ana', email: 'ana@example.id' },
                })
            );

            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-1', source: 'camera' });

                expect(feed().scanResult.value?.status).toBe('already');
                expect(feed().scanResult.value?.email).toBe('ana@example.id');
                expect(toastWarning).toHaveBeenCalledWith('Sudah check-in', {
                    description: 'Ana · ana@example.id',
                });
            } finally {
                wrapper.unmount();
            }
        });

        it('422: hasil invalid memakai judul generik dan toast pesan API', async () => {
            vi.mocked(axios.post).mockRejectedValue(axiosFailure(422, { message: 'Data tidak valid' }));

            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-1', source: 'manual' });

                expect(feed().scanResult.value?.status).toBe('invalid');
                expect(feed().scanResult.value?.name).toBe('Tidak dapat diproses');
                expect(feed().scanResult.value?.email).toBe('-');
                expect(toastError).toHaveBeenCalledTimes(1);
                expect(toastError.mock.calls[0]?.[0]).toBe('Data tidak valid');
            } finally {
                wrapper.unmount();
            }
        });

        it('429: hasil invalid dan pesan tunggu ditampilkan', async () => {
            vi.mocked(axios.post).mockRejectedValue(axiosFailure(429, {}));

            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-1', source: 'manual' });

                expect(feed().scanResult.value?.status).toBe('invalid');
                expect(feed().scanResult.value?.name).toBe('Terlalu banyak scan');
                expect(toastError.mock.calls[0]?.[0]).toBe('Terlalu banyak scan');
                expect(toastError.mock.calls[0]?.[1]).toMatchObject({
                    description: 'Tunggu sebentar sebelum memindai lagi.',
                });
            } finally {
                wrapper.unmount();
            }
        });

        it('kegagalan non-axios: hasil invalid jaringan dan toast permintaan gagal', async () => {
            vi.mocked(axios.post).mockRejectedValue(new Error('boom'));

            const { feed, wrapper } = mountFeedHost();
            try {
                await feed().submitScan({ raw: 'CODE-1', source: 'manual' });

                expect(feed().scanResult.value?.status).toBe('invalid');
                expect(feed().scanResult.value?.name).toBe('Kesalahan jaringan');
                expect(toastError.mock.calls[0]?.[0]).toBe('Permintaan gagal');
                expect(toastError.mock.calls[0]?.[1]).toMatchObject({ description: 'boom' });
            } finally {
                wrapper.unmount();
            }
        });
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readXsrfToken, sendFormAnswerReview } from '@/lib/inertiaRequest';

describe('readXsrfToken', () => {
    afterEach(() => {
        document.cookie = 'XSRF-TOKEN=; Max-Age=0';
    });

    it('membaca dan men-decode cookie XSRF-TOKEN', () => {
        document.cookie = `XSRF-TOKEN=${encodeURIComponent('a b+c')}`;
        expect(readXsrfToken()).toBe('a b+c');
    });

    it('null bila cookie belum ada', () => {
        document.cookie = 'XSRF-TOKEN=; Max-Age=0';
        expect(readXsrfToken()).toBeNull();
    });
});

describe('sendFormAnswerReview', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.cookie = 'XSRF-TOKEN=; Max-Age=0';
    });

    it('mengirim header CSRF + body review_status dan mengembalikan body objek', async () => {
        document.cookie = `XSRF-TOKEN=${encodeURIComponent('token-uji')}`;
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({ message: 'Conflict' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await sendFormAnswerReview({ url: '/review', method: 'patch', reviewStatus: 'accepted' });

        expect(result).toEqual({ ok: false, status: 409, body: { message: 'Conflict' } });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            '/review',
            expect.objectContaining({
                method: 'PATCH',
                credentials: 'same-origin',
                body: JSON.stringify({ review_status: 'accepted' }),
                headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'token-uji' }),
            })
        );
    });

    it('body null bila respons bukan objek', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => 'ok' }));

        const result = await sendFormAnswerReview({ url: '/review', method: 'patch', reviewStatus: 'rejected' });

        expect(result).toEqual({ ok: true, status: 200, body: null });
    });
});

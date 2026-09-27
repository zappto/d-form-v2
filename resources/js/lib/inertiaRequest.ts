/** Bentuk body respons JSON review; hanya `message` yang dibaca cepat (sisanya lewat parseApiErrorMessage). */
export interface IReviewResponseBody {
    message?: string;
}

/** Hasil request review: status HTTP + body JSON objek (null bila tidak ada / tidak bisa diparse). */
export interface IReviewRequestResult {
    ok: boolean;
    status: number;
    body: IReviewResponseBody | null;
}

/** Token CSRF Laravel dari cookie XSRF-TOKEN; null bila cookie belum ada. */
export function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    const encoded = match?.[1];
    return encoded ? decodeURIComponent(encoded) : null;
}

/** True bila body respons JSON review berbentuk objek (batas eksternal `res.json()`). */
function isReviewResponseBody(value: unknown): value is IReviewResponseBody {
    return value !== null && typeof value === 'object';
}

/** Kirim status review jawaban (accept/reject) dengan CSRF cookie; dipakai kedua halaman review. */
export async function sendFormAnswerReview(args: {
    url: string;
    method: string;
    reviewStatus: 'accepted' | 'rejected';
}): Promise<IReviewRequestResult> {
    const token = readXsrfToken();
    const response = await fetch(args.url, {
        method: args.method.toUpperCase(),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ review_status: args.reviewStatus }),
    });

    // Body respons HTTP (batas eksternal `res.json()`): `unknown` di sini disempitkan predikat objek.
    const rawBody: unknown = await response.json().catch(() => ({}));
    return {
        ok: response.ok,
        status: response.status,
        body: isReviewResponseBody(rawBody) ? rawBody : null,
    };
}

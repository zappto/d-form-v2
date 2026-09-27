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

/** Argumen kirim status review jawaban; `method` dinormalkan ke uppercase di dalam request. */
export interface ISendFormAnswerReviewArgs {
    url: string;
    method: string;
    reviewStatus: 'accepted' | 'rejected';
}

/** Kontrak hook akses request Inertia: baca token CSRF + kirim review jawaban. */
export interface IUseInertiaRequestResult {
    readXsrfToken: () => string | null;
    sendFormAnswerReview: (args: ISendFormAnswerReviewArgs) => Promise<IReviewRequestResult>;
}

/** Token CSRF Laravel dari cookie XSRF-TOKEN; null bila cookie belum ada. */
function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    const encoded = match?.[1];
    return encoded ? decodeURIComponent(encoded) : null;
}

/** True bila body respons JSON review berbentuk objek (batas eksternal `res.json()`). */
function isReviewResponseBody(value: unknown): value is IReviewResponseBody {
    return value !== null && typeof value === 'object';
}

/** Kirim status review jawaban (accept/reject) dengan CSRF cookie; dipakai kedua halaman review. */
async function sendFormAnswerReview(args: ISendFormAnswerReviewArgs): Promise<IReviewRequestResult> {
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

/** Hook akses request Inertia berbasis cookie CSRF; sediakan pembaca token + pengirim review jawaban. */
export function useInertiaRequest(): IUseInertiaRequestResult {
    return { readXsrfToken, sendFormAnswerReview };
}

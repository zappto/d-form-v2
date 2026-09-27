import { describe, expect, it } from 'vitest';
import { jsonRequestHeaders } from '../jsonRequest';

describe('jsonRequestHeaders', () => {
    it('mengembalikan pasangan header JSON+AJAX kanonik byte-identik', () => {
        expect(jsonRequestHeaders()).toEqual({
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        });
    });

    it('mengembalikan objek segar tiap panggilan (aman antar call-site)', () => {
        expect(jsonRequestHeaders()).not.toBe(jsonRequestHeaders());
    });
});

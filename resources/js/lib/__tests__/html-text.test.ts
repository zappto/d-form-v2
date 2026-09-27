import { describe, expect, it } from 'vitest';
import { hasMeaningfulHtmlText, stripHtmlToText } from '@/lib/htmlText';

describe('hasMeaningfulHtmlText', () => {
    it.each([
        [null, false],
        ['', false],
        ['   ', false],
        ['<p></p>', false],
        ['<p>&nbsp;</p>', false],
        ['<p>Halo</p>', true],
        ['Teks', true],
    ])('hasMeaningfulHtmlText(%j) === %s', (html, expected) => {
        expect(hasMeaningfulHtmlText(html)).toBe(expected);
    });
});

describe('stripHtmlToText', () => {
    it('membuang tag dan memadatkan spasi', () => {
        expect(stripHtmlToText('<p>Halo <b>dunia</b></p>')).toBe('Halo dunia');
    });

    it('membuang isi script dan style', () => {
        expect(stripHtmlToText('<script>alert(1)</script><style>x{}</style>Teks')).toBe('Teks');
    });

    it('mengembalikan string kosong untuk null dan string kosong', () => {
        expect(stripHtmlToText(null)).toBe('');
        expect(stripHtmlToText('')).toBe('');
    });

    it('memotong pada batas panjang dan menutup dengan elipsis', () => {
        const output = stripHtmlToText('abcdefghij', 5);
        expect(output).toBe('abcd…');
        expect(output.length).toBe(5);
    });
});

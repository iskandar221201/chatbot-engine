import { describe, it, expect } from 'vitest';
import { DateParser } from '../src/lib/date-parser';
import { NumberParser } from '../src/lib/number-parser';
import { SentimentAnalyzer } from '../src/lib/sentiment';

describe('DateParser', () => {
    it('should parse relative dates', () => {
        const besok = DateParser.parse('besok');
        expect(besok).not.toBeNull();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        expect(besok!.date.getDate()).toBe(tomorrow.getDate());
        expect(besok!.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should parse "lusa" (day after tomorrow)', () => {
        const lusa = DateParser.parse('lusa');
        expect(lusa).not.toBeNull();

        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        expect(lusa!.date.getDate()).toBe(dayAfterTomorrow.getDate());
    });

    it('should parse week patterns', () => {
        const mingguDepan = DateParser.parse('minggu depan');
        expect(mingguDepan).not.toBeNull();

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        expect(mingguDepan!.date.getDate()).toBe(nextWeek.getDate());
    });

    it('should parse day names', () => {
        const senin = DateParser.parse('senin');
        expect(senin).not.toBeNull();
        // Should be a Monday (day index 1)
        expect(senin!.date.getDay()).toBe(1);
    });

    it('should parse absolute dates with month', () => {
        const tanggal = DateParser.parse('tanggal 15 januari');
        expect(tanggal).not.toBeNull();
        expect(tanggal!.date.getDate()).toBe(15);
        expect(tanggal!.date.getMonth()).toBe(0); // January
    });

    it('should extract time hints', () => {
        const besokPagi = DateParser.parse('besok pagi');
        expect(besokPagi).not.toBeNull();
        expect(besokPagi!.timeHint).toBe('pagi');
    });

    it('should return null for invalid input', () => {
        expect(DateParser.parse('')).toBeNull();
        expect(DateParser.parse('random text here')).toBeNull();
    });

    it('should format date to Indonesian', () => {
        const date = new Date(2024, 0, 15); // Jan 15, 2024
        const formatted = DateParser.format(date);
        expect(formatted).toContain('15');
        expect(formatted).toContain('Januari');
        expect(formatted).toContain('2024');
    });

    it('should get relative description', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(DateParser.getRelative(tomorrow)).toBe('besok');

        const today = new Date();
        expect(DateParser.getRelative(today)).toBe('hari ini');
    });
});

describe('NumberParser', () => {
    it('should parse shorthand formats', () => {
        expect(NumberParser.parse('2jt')).toBe(2000000);
        expect(NumberParser.parse('500rb')).toBe(500000);
        expect(NumberParser.parse('1.5juta')).toBe(1500000);
    });

    it('should parse Indonesian word numbers', () => {
        expect(NumberParser.parse('seratus')).toBe(100);
        expect(NumberParser.parse('seribu')).toBe(1000);
        expect(NumberParser.parse('sejuta')).toBe(1000000);
    });

    it('should parse combined word numbers', () => {
        expect(NumberParser.parse('seratus ribu')).toBe(100000);
        expect(NumberParser.parse('dua juta')).toBe(2000000);
        expect(NumberParser.parse('lima puluh ribu')).toBe(50000);
    });

    it('should parse Indonesian formatted numbers', () => {
        // Indonesian uses . as thousand separator
        expect(NumberParser.parse('1.500.000')).toBe(1500000);
        expect(NumberParser.parse('500.000')).toBe(500000);
    });

    it('should handle currency prefix', () => {
        expect(NumberParser.parse('Rp 2jt')).toBe(2000000);
        expect(NumberParser.parse('Rp. 500rb')).toBe(500000);
    });

    it('should return null for invalid input', () => {
        expect(NumberParser.parse('')).toBeNull();
        expect(NumberParser.parse('abc')).toBeNull();
    });

    it('should format currency', () => {
        const formatted = NumberParser.formatCurrency(2000000);
        expect(formatted).toContain('Rp');
        expect(formatted).toContain('2');
    });

    it('should convert number to words', () => {
        expect(NumberParser.toWords(100)).toBe('seratus');
        expect(NumberParser.toWords(1000)).toBe('seribu');
        expect(NumberParser.toWords(25)).toBe('dua puluh lima');
    });
});

describe('SentimentAnalyzer', () => {
    it('should detect positive sentiment', () => {
        const result = SentimentAnalyzer.analyze('produk ini bagus banget mantap!');
        expect(result.label).toBe('positive');
        expect(result.score).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
        const result = SentimentAnalyzer.analyze('kecewa sekali, pelayanan buruk dan lambat');
        expect(result.label).toBe('negative');
        expect(result.score).toBeLessThan(0);
    });

    it('should detect neutral sentiment', () => {
        const result = SentimentAnalyzer.analyze('okay biasa saja');
        expect(result.label).toBe('neutral');
    });

    it('should detect urgency', () => {
        const urgent = SentimentAnalyzer.analyze('tolong segera diproses!!');
        expect(urgent.isUrgent).toBe(true);

        const normal = SentimentAnalyzer.analyze('baik, terima kasih');
        expect(normal.isUrgent).toBe(false);
    });

    it('should handle negation', () => {
        const notGood = SentimentAnalyzer.analyze('tidak bagus');
        expect(notGood.label).toBe('negative');

        const notBad = SentimentAnalyzer.analyze('tidak buruk');
        expect(notBad.score).toBeGreaterThanOrEqual(0);
    });

    it('should detect intensity from exclamation marks', () => {
        const excited = SentimentAnalyzer.analyze('bagus banget!!!');
        expect(excited.intensity).not.toBe('low');
    });

    it('should provide quick helpers', () => {
        expect(SentimentAnalyzer.isPositive('mantap sekali')).toBe(true);
        expect(SentimentAnalyzer.isNegative('kecewa berat')).toBe(true);
        expect(SentimentAnalyzer.isUrgent('urgent tolong bantu!')).toBe(true);
    });

    it('should calculate priority for customer service', () => {
        const urgent = SentimentAnalyzer.getPriority('URGENT!! sangat kecewa parah!!');
        const normal = SentimentAnalyzer.getPriority('terima kasih, bagus');

        expect(urgent).toBeGreaterThanOrEqual(4);
        expect(normal).toBeLessThan(3);
    });

    it('should return details', () => {
        const result = SentimentAnalyzer.analyze('sangat bagus dan mantap');
        expect(result.details.positiveWords.length).toBeGreaterThan(0);
        expect(result.details.intensifiers.length).toBeGreaterThan(0);
    });
});

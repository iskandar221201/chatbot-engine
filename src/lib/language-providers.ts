/**
 * Language Provider System
 * Abstracting linguistic logic (Normalization, Stemming, Stopwords) per language.
 */

import { Stemmer } from "./sastrawi";
import { DEFAULT_STOP_WORDS } from "../defaults";

export interface ILanguageProvider {
    locale: string;
    normalize(text: string): string;
    stem(word: string): string;
    getStopWords(): string[];
}

/**
 * Indonesian Provider (Default)
 * Uses Sastrawi for stemming.
 */
export class IndonesianProvider implements ILanguageProvider {
    public locale = 'id';
    private stemmer = new Stemmer();

    public normalize(text: string): string {
        return text.toLowerCase().replace(/[^\w\s]/g, '');
    }

    public stem(word: string): string {
        return this.stemmer.stem(word);
    }

    public getStopWords(): string[] {
        return DEFAULT_STOP_WORDS;
    }
}

/**
 * English Provider
 * Basic regex-based stemming for common suffixes.
 */
export class EnglishProvider implements ILanguageProvider {
    public locale = 'en';

    public normalize(text: string): string {
        return text.toLowerCase().replace(/[^\w\s]/g, '');
    }

    public stem(word: string): string {
        // Basic stemming for common English suffixes
        if (word.length <= 3) return word;

        let result = word.toLowerCase();

        if (result.endsWith('ies')) return result.slice(0, -3) + 'y';
        if (result.endsWith('s')) result = result.slice(0, -1);

        if (result.endsWith('ing')) {
            result = result.slice(0, -3);
            // Handle double consonants (e.g., running -> run)
            if (result.length > 3 && result[result.length - 1] === result[result.length - 2]) {
                result = result.slice(0, -1);
            }
        } else if (result.endsWith('ed')) {
            result = result.slice(0, -2);
            if (result.length > 3 && result[result.length - 1] === result[result.length - 2]) {
                result = result.slice(0, -1);
            }
        }

        return result;
    }

    public getStopWords(): string[] {
        return [
            'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'shall', 'should', 'would', 'can', 'could', 'of', 'at',
            'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
            'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
            'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
            'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
            'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
            'should', 'now'
        ];
    }
}

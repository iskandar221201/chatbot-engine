import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SiteCrawler } from '../src/crawler';

describe('SiteCrawler', () => {
    let crawler: SiteCrawler;

    // Mock global fetch and DOMParser
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const mockParseFromString = vi.fn();
    class MockDOMParser {
        parseFromString(str: string, type: string) {
            return mockParseFromString(str, type);
        }
    }
    global.DOMParser = MockDOMParser as any;

    // Helper to create mock DOM
    const createMockDoc = (title: string, content: string, links: string[] = []) => {
        return {
            querySelector: (sel: string) => {
                if (sel === 'title') return { textContent: title };
                if (sel === 'meta[name="description"]') return { getAttribute: () => 'Description for ' + title };
                if (sel === 'meta[name="keywords"]') return { getAttribute: () => 'keyword1, keyword2' };
                return null;
            },
            querySelectorAll: (sel: string) => {
                if (sel === 'a[href]') {
                    return links.map(href => ({ getAttribute: () => href }));
                }
                if (sel.includes('script')) return []; // Mock for remove logic
                return [];
            },
            body: {
                cloneNode: () => ({
                    querySelectorAll: () => [],
                    innerText: content,
                    remove: () => { }
                })
            }
        };
    };

    beforeEach(() => {
        crawler = new SiteCrawler('https://example.com', {
            maxDepth: 1,
            maxPages: 5,
            autoCrawl: true
        });
        vi.clearAllMocks();
    });

    it('should initialize with correct config', () => {
        expect(crawler).toBeDefined();
    });

    it('should crawl a single page correctly', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => '<html>...</html>'
        });

        mockParseFromString.mockReturnValue(createMockDoc('Home Page', 'Welcome to our site'));

        const results = await crawler.crawlAll('/');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Home Page');
        expect(results[0].content).toBe('Welcome to our site');
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/');
    });

    it('should crawl links recursively within depth limit', async () => {
        crawler = new SiteCrawler('https://example.com', { maxDepth: 2 });

        // First Page
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => '<html>...</html>'
        });
        mockParseFromString.mockReturnValueOnce(createMockDoc('Home', 'Home Content', ['/about', '/contact']));

        // Second Page (About)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => '<html>...</html>'
        });
        mockParseFromString.mockReturnValueOnce(createMockDoc('About', 'About Content'));

        // Third Page (Contact)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => '<html>...</html>'
        });
        mockParseFromString.mockReturnValueOnce(createMockDoc('Contact', 'Contact Content'));

        const results = await crawler.crawlAll('/');

        expect(results).toHaveLength(3);
        const titles = results.map(r => r.title).sort();
        expect(titles).toEqual(['About', 'Contact', 'Home']);
    });

    it('should ignore ignorePatterns', async () => {
        // Setup crawler to ignore 'contact'
        crawler = new SiteCrawler('https://example.com', {
            ignorePatterns: ['contact']
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => '<html>...</html>'
        });
        // Home links to contact
        mockParseFromString.mockReturnValueOnce(createMockDoc('Home', 'Home Content', ['/contact']));

        const results = await crawler.crawlAll('/');

        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Home');
        // Should NOT fetch contact
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network Error'));

        const results = await crawler.crawlAll('/');

        expect(results).toHaveLength(0);
    });

});

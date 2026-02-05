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
    const createMockDoc = (title: string, content: string, links: string[] = [], options: { html?: string } = {}) => {
        const body = {
            cloneNode: () => {
                const div = {
                    innerText: content,
                    querySelectorAll: (sel: string) => {
                        // Very simple mock for selector-based removal
                        if (options.html) {
                            if (sel.includes('button')) {
                                return options.html.includes('<button') ? [{ remove: () => { } }] : [];
                            }
                            if (sel.includes('nav')) {
                                return options.html.includes('<nav') ? [{ remove: () => { } }] : [];
                            }
                        }
                        return [];
                    },
                    remove: () => { }
                };
                return div;
            }
        };

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
                return [];
            },
            body
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

    it('should exclude noise like buttons and nav by default', async () => {
        const htmlWithNoise = '<html><body><nav>Menu</nav><div>Main Content</div><button>Click Me</button></body></html>';
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => htmlWithNoise
        });

        // The mock implementation of extractMainContent in the test needs to be careful.
        // In the real crawler.ts, it clones and removes.
        // We've updated createMockDoc to return a mock that handles querySelectorAll for noise.
        const mockDoc = createMockDoc('Test', 'Main Content', [], { html: htmlWithNoise });
        mockParseFromString.mockReturnValueOnce(mockDoc);

        const results = await crawler.crawlAll('/');
        expect(results[0].content).toBe('Main Content');
    });

    it('should support custom contentSelectors', async () => {
        crawler = new SiteCrawler('https://example.com', {
            contentSelectors: '.article-body'
        });

        const html = '<html><body><div class="sidebar">Ads</div><div class="article-body">Real Content</div></body></html>';
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: { get: () => 'text/html' },
            text: async () => html
        });

        // Mocking the behavior where only .article-body is picked
        const mockDoc = {
            ...createMockDoc('Test', 'Ads Real Content'),
            body: {
                cloneNode: () => ({
                    querySelectorAll: (sel: string) => {
                        if (sel === '.article-body') {
                            return [{ innerText: 'Real Content' }];
                        }
                        return [];
                    },
                    remove: () => { }
                })
            }
        };
        mockParseFromString.mockReturnValueOnce(mockDoc);

        const results = await crawler.crawlAll('/');
        expect(results[0].content).toBe('Real Content');
    });

});

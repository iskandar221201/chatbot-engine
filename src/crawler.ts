import { AssistantDataItem } from './types';

export interface CrawlerConfig {
    maxDepth?: number;
    maxPages?: number;
    ignorePatterns?: (string | RegExp)[];
    autoCrawl?: boolean;
}

export class SiteCrawler {
    private baseUrl: string;
    private visited: Set<string>;
    private data: AssistantDataItem[];
    private config: CrawlerConfig;

    constructor(baseUrl: string = '', config: CrawlerConfig = {}) {
        this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        this.visited = new Set();
        this.data = [];
        this.config = {
            maxDepth: 2,
            maxPages: 50,
            ignorePatterns: [/\.(jpg|jpeg|png|gif|pdf|css|js|json|svg|ico)$/i, /#.*$/, /mailto:/, /tel:/],
            ...config
        };
    }

    /**
     * Start crawling from a specific path or the current location
     */
    async crawlAll(startPath: string = '/'): Promise<AssistantDataItem[]> {
        if (!this.baseUrl) {
            console.error('SiteCrawler: Base URL not set. Cannot crawl.');
            return [];
        }

        const startUrl = new URL(startPath, this.baseUrl).href;
        const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

        while (queue.length > 0 && this.data.length < (this.config.maxPages || 50)) {
            const current = queue.shift();
            if (!current) break;

            if (this.visited.has(current.url)) continue;
            if (current.depth > (this.config.maxDepth || 2)) continue;

            try {
                // Check ignore patterns
                if (this.shouldIgnore(current.url)) {
                    this.visited.add(current.url);
                    continue;
                }

                const result = await this.processPage(current.url);
                this.visited.add(current.url);

                if (result) {
                    this.data.push(result.data);

                    // Add links to queue
                    if (current.depth < (this.config.maxDepth || 2)) {
                        result.links.forEach(link => {
                            if (!this.visited.has(link)) {
                                queue.push({ url: link, depth: current.depth + 1 });
                            }
                        });
                    }
                }

            } catch (e) {
                console.warn(`SiteCrawler: Failed to crawl ${current.url}`, e);
                this.visited.add(current.url);
            }
        }

        return this.data;
    }

    private shouldIgnore(url: string): boolean {
        return !!this.config.ignorePatterns?.some(pattern =>
            typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
        );
    }

    private async processPage(url: string): Promise<{ data: AssistantDataItem; links: string[] } | null> {
        const response = await fetch(url);
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) return null;

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const title = doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const mainContent = this.extractMainContent(doc);

        const data: AssistantDataItem = {
            title: title.trim() || new URL(url).pathname,
            description: description.trim() || mainContent.substring(0, 150) + '...',
            url: url,
            category: 'Page',
            keywords: this.extractKeywords(doc),
            content: mainContent // Storing full content for better indexing if needed
        };

        const links = Array.from(doc.querySelectorAll('a[href]'))
            .map(a => a.getAttribute('href'))
            .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:'))
            .map(href => {
                try {
                    return new URL(href!, this.baseUrl).href;
                } catch {
                    return null;
                }
            })
            .filter((href): href is string => !!href && href.startsWith(this.baseUrl));

        return { data, links };
    }

    private extractMainContent(doc: Document): string {
        // Remove scripts, styles, and other non-content elements
        const clone = doc.body.cloneNode(true) as HTMLElement;
        const toRemove = clone.querySelectorAll('script, style, noscript, iframe, header, footer, nav');
        toRemove.forEach(el => el.remove());

        return clone.innerText.replace(/\s+/g, ' ').trim();
    }

    private extractKeywords(doc: Document): string[] {
        const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content');
        if (keywords) {
            return keywords.split(',').map(k => k.trim());
        }

        // Fallback: extract mostly used words? or just empty
        return [];
    }
}

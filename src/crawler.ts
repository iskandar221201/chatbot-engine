import { AssistantDataItem } from './types';

export interface CrawlerConfig {
    maxDepth?: number;
    maxPages?: number;
    ignorePatterns?: (string | RegExp)[];
    autoCrawl?: boolean;
    category?: string;
    onProgress?: (progress: { url: string, totalIndexed: number, status: string }) => void;
    /** Elements to exclude from indexing (e.g., 'button, nav, footer') */
    excludeSelectors?: string;
    /** If specified, only content within these selectors will be indexed */
    contentSelectors?: string;
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
            category: 'Page',
            ...config
        };
    }

    /**
     * Start crawling from a specific path or the current location
     */
    public markAsVisited(url: string) {
        this.visited.add(url);
    }

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
                    if (this.config.onProgress) {
                        this.config.onProgress({ url: current.url, totalIndexed: this.data.length, status: 'ignored' });
                    }
                    continue;
                }

                if (this.config.onProgress) {
                    this.config.onProgress({ url: current.url, totalIndexed: this.data.length, status: 'crawling' });
                }

                const result = await this.processPage(current.url);
                this.visited.add(current.url);

                if (result) {
                    this.data.push(result.data);

                    if (this.config.onProgress) {
                        this.config.onProgress({ url: current.url, totalIndexed: this.data.length, status: 'indexed' });
                    }

                    // Add links to queue
                    if (current.depth < (this.config.maxDepth || 2)) {
                        result.links.forEach(link => {
                            if (!this.visited.has(link)) {
                                queue.push({ url: link, depth: current.depth + 1 });
                            }
                        });
                    }
                }

            } catch (e: any) {
                console.warn(`SiteCrawler: Failed to crawl ${current.url}`, e);
                this.visited.add(current.url);
                if (this.config.onProgress) {
                    let failStatus = 'failed';
                    if (window.location.protocol === 'file:') failStatus = 'local_file_cors';
                    else if (e.name === 'TypeError') failStatus = 'network_error';

                    this.config.onProgress({ url: current.url, totalIndexed: this.data.length, status: failStatus });
                }
            }
        }

        return this.data;
    }

    private shouldIgnore(url: string): boolean {
        return !!this.config.ignorePatterns?.some(pattern =>
            typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url)
        );
    }

    public processDocument(doc: Document, url: string, category: string = 'Page'): AssistantDataItem {
        const title = doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const mainContent = this.extractMainContent(doc);

        return {
            title: title.trim() || new URL(url).pathname,
            description: description.trim() || mainContent.substring(0, 150) + '...',
            url: url,
            category: category,
            keywords: this.extractKeywords(doc),
            content: mainContent
        };
    }

    private async processPage(url: string): Promise<{ data: AssistantDataItem; links: string[] } | null> {
        const response = await fetch(url);
        if (!response.ok) return null;

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) return null;

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const data = this.processDocument(doc, url, this.config.category);

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
        // Create a clone to avoid mutating the original document
        const clone = doc.body.cloneNode(true) as HTMLElement;

        // 1. Remove non-content elements (default set)
        const defaultExclude = 'script, style, noscript, iframe, header, footer, nav, button, input, select, textarea, form, svg, canvas, [role="button"], [role="navigation"]';
        const toRemove = clone.querySelectorAll(defaultExclude);
        toRemove.forEach(el => el.remove());

        // 2. Apply custom exclude selectors if provided
        if (this.config.excludeSelectors) {
            const customExclude = clone.querySelectorAll(this.config.excludeSelectors);
            customExclude.forEach(el => el.remove());
        }

        // 3. Focus on content selectors if provided
        if (this.config.contentSelectors) {
            const contentElements = clone.querySelectorAll(this.config.contentSelectors);
            if (contentElements.length > 0) {
                return Array.from(contentElements)
                    .map(el => (el as HTMLElement).innerText)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }

        // 4. Default: Get all remaining text content
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

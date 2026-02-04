import { SearchDataItem, SearchResult, AIConfig } from './types';
export declare class CoreEngine {
    private data;
    private Fuse;
    private fuseInstance;
    private config;
    private context;
    constructor(data: SearchDataItem[], FuseClass: any, config?: AIConfig);
    private initializeFuse;
    search(query: string): SearchResult;
    private preprocess;
    private getProliminaryCandidates;
    private detectIntent;
    private calculateAIScore;
    private updateContext;
    private getIntentCounts;
    setPreference(key: string, value: any): void;
}

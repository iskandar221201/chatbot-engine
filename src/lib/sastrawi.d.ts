export class Stemmer {
    constructor(dictionary?: string[]);
    stem(word: string): string;
}
export class Tokenizer {
    tokenize(text: string): string[];
}

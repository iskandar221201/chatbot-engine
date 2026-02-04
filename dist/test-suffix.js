"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CoreEngine_1 = require("./CoreEngine");
// Mock Fuse class for testing without actual Fuse dependency if needed, 
// but we just need it to not crash.
class MockFuse {
    constructor(data) { this.data = data; }
    search(q) { return []; }
}
const mockData = [
    { title: "Buku Sejarah", category: "Education", description: "Buku tentang sejarah", keywords: ["buku", "sejarah"], url: "", id: "1" }
];
const config = {
    // Indonesian suffix examples
    stemmingSuffixes: ['nya', 'kan', 'mu', 'lah', 'kah', 'i']
};
const engine = new CoreEngine_1.CoreEngine(mockData, MockFuse, config);
// Access private method for testing via any cast
const engineAny = engine;
console.log("--- Testing Suffix Removal ---");
const testWords = [
    { input: "bukunya", expected: "buku" },
    { input: "bacakan", expected: "baca" }, // assuming 'baca' is base and 'kan' is suffix
    { input: "rumahnya", expected: "rumah" },
    { input: "dimana", expected: "dimana" }, // no suffix match
    { input: "jalankan", expected: "jalan" }, // 'jalan' + 'kan'
    { input: "pertemuannya", expected: "pertemuan" }, // 'pertemuan' + 'nya'
    // Recursive/Iterative cases if supported (current impl is iterative)
    { input: "bukunyalah", expected: "buku" }, // 'buku' + 'nya' + 'lah' -> strip 'lah' -> 'bukunya' -> strip 'nya' -> 'buku'
    { input: "lakukanlah", expected: "laku" }, // 'laku' + 'kan' + 'lah'
];
testWords.forEach(({ input, expected }) => {
    // We need to inspect the 'preprocess' result or just simulate the logic if it was public.
    // Since preprocess is private, let's call it via 'any' or test 'search' keywords matches?
    // Easier: Test 'preprocess' via any.
    const result = engineAny.preprocess(input);
    const expanded = result.expandedTokens;
    const hasRoot = expanded.includes(expected);
    console.log(`Input: "${input}"`);
    console.log(`  -> Expanded: ${JSON.stringify(expanded)}`);
    if (hasRoot) {
        console.log(`  [PASS] Found root "${expected}"`);
    }
    else {
        console.error(`  [FAIL] Expected root "${expected}" not found.`);
    }
});

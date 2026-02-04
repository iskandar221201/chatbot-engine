/**
 * Security Guard
 * Input sanitization and validation for server-side safety
 */

export interface SecurityConfig {
    maxLength?: number;
    blockScripts?: boolean;
    blockSqlInjectionPatterns?: boolean;
    allowedTags?: string[];
    strictMode?: boolean;
}

export interface SecurityCheckResult {
    isValid: boolean;
    sanitized: string;
    threats: string[];
    original: string;
}

export class SecurityGuard {
    private config: Required<SecurityConfig>;

    constructor(config: SecurityConfig = {}) {
        this.config = {
            maxLength: config.maxLength ?? 500,
            blockScripts: config.blockScripts ?? true,
            blockSqlInjectionPatterns: config.blockSqlInjectionPatterns ?? true,
            allowedTags: config.allowedTags ?? [],
            strictMode: config.strictMode ?? false
        };
    }

    /**
     * Sanitize and validate input
     */
    process(input: string): SecurityCheckResult {
        if (!input || typeof input !== 'string') {
            return { isValid: false, sanitized: '', threats: ['Invalid Input Type'], original: input };
        }

        const threats: string[] = [];
        let sanitized = input;

        // 1. Length Check
        if (input.length > this.config.maxLength) {
            threats.push('Length Exceeded');
            sanitized = sanitized.substring(0, this.config.maxLength);
        }

        // 2. Script Injection Blocking
        if (this.config.blockScripts) {
            const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>|javascript:|on\w+=/gi;
            if (scriptPattern.test(sanitized)) {
                threats.push('Script Injection Attempt');
                sanitized = sanitized.replace(scriptPattern, '');
            }
        }

        // 3. HTML Tag Stripping (allow specific tags)
        if (this.config.allowedTags.length === 0) {
            // Remove all HTML tags
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        } else {
            // Remove tags NOT in allowed list
            // Note: This is a basic regex-based stripping, acceptable for simple text
            const allowed = this.config.allowedTags.join('|');
            const pattern = new RegExp(`<(?!/?(${allowed})\\b)[^>]*>`, 'gi');
            sanitized = sanitized.replace(pattern, '');
        }

        // 4. SQL Injection Patterns (Basic Detection)
        if (this.config.blockSqlInjectionPatterns) {
            const sqlPatterns = [
                /(\b(union|select|insert|update|delete|drop|alter)\b.*\b(from|into|table|database)\b)/i,
                /(\b1\s*=\s*1\b)/,
                /(--)/
            ];

            for (const pattern of sqlPatterns) {
                if (pattern.test(sanitized)) {
                    threats.push('SQL Injection Pattern');
                    // In strict mode, we might reject entirely. 
                    // For now, we just flag it. sanitize isn't easy for SQL without destroying context.
                    if (this.config.strictMode) sanitized = '';
                }
            }
        }

        // 5. Control Character Removal
        sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

        return {
            isValid: threats.length === 0 || (threats.length === 1 && threats[0] === 'Length Exceeded'),
            sanitized: sanitized.trim(),
            threats,
            original: input
        };
    }

    /**
     * Quick sanitize helper
     */
    static clean(input: string): string {
        const guard = new SecurityGuard();
        return guard.process(input).sanitized;
    }

    /**
     * Check if input is safe
     */
    static isSafe(input: string): boolean {
        const guard = new SecurityGuard();
        return guard.process(input).isValid;
    }
}

export default SecurityGuard;

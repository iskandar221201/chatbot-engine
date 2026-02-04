import { describe, it, expect } from 'vitest';
import { SecurityGuard } from '../src/lib/security-guard';

describe('SecurityGuard', () => {
    it('should sanitize script tags', () => {
        const input = 'Hello <script>alert("xss")</script> World';
        const result = SecurityGuard.clean(input);
        expect(result).toBe('Hello  World');
    });

    it('should sanitize event handlers', () => {
        const input = 'Hello <img src="x" onerror="alert(1)" /> World';
        const result = SecurityGuard.clean(input);
        expect(result).toBe('Hello  World');
    });

    it('should enforce max length', () => {
        const guard = new SecurityGuard({ maxLength: 10 });
        const result = guard.process('123456789012345');
        expect(result.sanitized.length).toBe(10);
        expect(result.threats).toContain('Length Exceeded');
    });

    it('should detect SQL injection patterns', () => {
        const guard = new SecurityGuard({ blockSqlInjectionPatterns: true });
        const result = guard.process("SELECT * FROM users WHERE 1=1");
        expect(result.threats).toContain('SQL Injection Pattern');
    });

    it('should allow valid input', () => {
        const input = 'Halo, saya mau beli produk ini budget 2jt';
        const result = SecurityGuard.clean(input);
        expect(result).toBe(input);
    });

    it('should handle strict mode', () => {
        const guard = new SecurityGuard({ strictMode: true });
        const result = guard.process("SELECT * FROM users");
        expect(result.sanitized).toBe(''); // Blocked entirely
    });
});

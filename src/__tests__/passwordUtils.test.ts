import { describe, it, expect } from 'vitest';
import { validatePasswordStrength, getStrengthColor, getStrengthLabel } from '../../utils/passwordUtils';

describe('passwordUtils', () => {
    describe('validatePasswordStrength', () => {
        it('should return error for empty password', () => {
            const result = validatePasswordStrength('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('La contraseña es obligatoria');
            expect(result.strength).toBe('weak');
            expect(result.score).toBe(0);
        });

        it('should return error for password under 8 characters', () => {
            const result = validatePasswordStrength('abc');
            expect(result.errors).toContain('Debe tener al menos 8 caracteres');
        });

        it('should return errors for missing uppercase', () => {
            const result = validatePasswordStrength('abcdefgh');
            expect(result.errors).toContain('Debe contener al menos una letra mayúscula');
        });

        it('should return errors for missing lowercase', () => {
            const result = validatePasswordStrength('ABCDEFGH');
            expect(result.errors).toContain('Debe contener al menos una letra minúscula');
        });

        it('should return errors for missing number', () => {
            const result = validatePasswordStrength('AbcDefgh');
            expect(result.errors).toContain('Debe contener al menos un número');
        });

        it('should return errors for missing special character', () => {
            const result = validatePasswordStrength('AbcDefgh1');
            expect(result.errors).toContain('Debe contener al menos un carácter especial (!@#$%^&*, etc.)');
        });

        it('should accept a valid password', () => {
            const result = validatePasswordStrength('SecurePass123!');
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should detect common passwords', () => {
            const result = validatePasswordStrength('password');
            expect(result.errors).toContain('Esta contraseña es demasiado común. Elegí una más segura');
        });

        it('should detect repeated characters', () => {
            const result = validatePasswordStrength('Aaabbbcc1!');
            expect(result.errors).toContain('Evitá usar el mismo carácter repetido');
        });

        it('should detect weak password with very low complexity', () => {
            const result = validatePasswordStrength('abc');
            expect(result.strength).toBe('weak');
            expect(result.score).toBeLessThan(40);
        });

        it('should detect strong password', () => {
            const result = validatePasswordStrength('SecurePass123!');
            expect(result.strength).toBe('strong');
            expect(result.score).toBeGreaterThanOrEqual(70);
        });

        it('should normalize score between 0 and 100', () => {
            const result = validatePasswordStrength('Abcdefgh1!');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should detect password without special character', () => {
            const result = validatePasswordStrength('Abcdefgh1');
            expect(result.errors).toContain('Debe contener al menos un carácter especial (!@#$%^&*, etc.)');
        });

        it('should give higher score for more complex passwords', () => {
            const basic = validatePasswordStrength('Abcdefgh');
            const withNumber = validatePasswordStrength('Abcdefgh1');
            const withSpecial = validatePasswordStrength('Abcdefgh1!');
            
            expect(withNumber.score).toBeGreaterThan(basic.score);
            expect(withSpecial.score).toBeGreaterThan(withNumber.score);
        });
    });

    describe('getStrengthColor', () => {
        it('should return red for weak', () => {
            expect(getStrengthColor('weak')).toBe('bg-red-500');
        });

        it('should return yellow for medium', () => {
            expect(getStrengthColor('medium')).toBe('bg-yellow-500');
        });

        it('should return green for strong', () => {
            expect(getStrengthColor('strong')).toBe('bg-green-500');
        });
    });

    describe('getStrengthLabel', () => {
        it('should return weak label in Spanish', () => {
            expect(getStrengthLabel('weak')).toBe('Débil');
        });

        it('should return medium label in Spanish', () => {
            expect(getStrengthLabel('medium')).toBe('Media');
        });

        it('should return strong label in Spanish', () => {
            expect(getStrengthLabel('strong')).toBe('Fuerte');
        });
    });
});

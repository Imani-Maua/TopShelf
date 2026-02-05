const { hashPassword, verifyPassword, generateTemporaryPassword, validatePasswordStrength } = require('../../../core/auth/utils/passwordUtils');

describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'TestPassword123!';
            const hashed = await hashPassword(password);

            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            expect(hashed.length).toBeGreaterThan(0);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'SamePassword123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2); // Bcrypt uses salt
        });
    });

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'CorrectPassword123!';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(password, hash);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'CorrectPassword123!';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword('WrongPassword123!', hash);

            expect(isValid).toBe(false);
        });

        it('should reject completely different password', async () => {
            const password = 'MyPassword123!';
            const hash = await hashPassword(password);
            const isValid = await verifyPassword('CompletelyDifferent456!', hash);

            expect(isValid).toBe(false);
        });
    });

    describe('generateTemporaryPassword', () => {
        it('should generate a password of length 12', () => {
            const tempPassword = generateTemporaryPassword();
            expect(tempPassword).toHaveLength(12);
        });

        it('should generate different passwords each time', () => {
            const pass1 = generateTemporaryPassword();
            const pass2 = generateTemporaryPassword();
            const pass3 = generateTemporaryPassword();

            expect(pass1).not.toBe(pass2);
            expect(pass2).not.toBe(pass3);
            expect(pass1).not.toBe(pass3);
        });

        it('should only contain alphanumeric characters', () => {
            const tempPassword = generateTemporaryPassword();
            // Check that it only contains characters from the allowed set
            const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]+$/;
            expect(tempPassword).toMatch(validChars);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should accept strong password', () => {
            const result = validatePasswordStrength('StrongPass123!');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject password without uppercase', () => {
            const result = validatePasswordStrength('weakpass123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without lowercase', () => {
            const result = validatePasswordStrength('WEAKPASS123!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without number', () => {
            const result = validatePasswordStrength('WeakPassword!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject password that is too short', () => {
            const result = validatePasswordStrength('Short1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should return multiple errors for very weak password', () => {
            const result = validatePasswordStrength('weak');
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
            expect(result.errors).toContain('Password must be at least 8 characters long');
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should accept password with exactly 8 characters', () => {
            const result = validatePasswordStrength('Pass123a');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});

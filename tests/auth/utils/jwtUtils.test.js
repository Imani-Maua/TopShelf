const { createToken, verifyToken, extractJti } = require('../../../core/auth/utils/jwtUtils');

describe('JWT Utils', () => {
    const testPayload = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        type: 'access'
    };

    describe('createToken', () => {
        it('should create a valid JWT token', () => {
            const result = createToken(testPayload, '24h');

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('jti');
            expect(typeof result.token).toBe('string');
            expect(result.token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate unique JTI for each token', () => {
            const token1 = createToken(testPayload, '1h');
            const token2 = createToken(testPayload, '1h');

            expect(token1.jti).not.toBe(token2.jti);
            expect(token1.token).not.toBe(token2.token);
        });

        it('should include JTI in token payload', () => {
            const { token, jti } = createToken(testPayload, '1h');
            const decoded = verifyToken(token);

            expect(decoded.jti).toBe(jti);
        });
    });

    describe('verifyToken', () => {
        it('should verify and decode valid token', () => {
            const { token } = createToken(testPayload, '1h');
            const decoded = verifyToken(token);

            expect(decoded).toHaveProperty('id');
            expect(decoded).toHaveProperty('username');
            expect(decoded).toHaveProperty('email');
            expect(decoded).toHaveProperty('role');
            expect(decoded).toHaveProperty('jti');
            expect(decoded.id).toBe(testPayload.id);
            expect(decoded.username).toBe(testPayload.username);
        });

        it('should throw error for invalid token', () => {
            expect(() => {
                verifyToken('invalid.token.string');
            }).toThrow('Invalid or expired token');
        });

        it('should throw error for malformed token', () => {
            expect(() => {
                verifyToken('not-a-jwt-at-all');
            }).toThrow('Invalid or expired token');
        });

        it('should throw error for empty token', () => {
            expect(() => {
                verifyToken('');
            }).toThrow('Invalid or expired token');
        });

        it('should verify token with all payload data intact', () => {
            const customPayload = {
                id: 'admin456',
                username: 'adminuser',
                email: 'admin@example.com',
                role: 'admin',
                type: 'access',
                customField: 'customValue'
            };

            const { token } = createToken(customPayload, '2h');
            const decoded = verifyToken(token);

            expect(decoded.id).toBe(customPayload.id);
            expect(decoded.username).toBe(customPayload.username);
            expect(decoded.email).toBe(customPayload.email);
            expect(decoded.role).toBe(customPayload.role);
            expect(decoded.type).toBe(customPayload.type);
            expect(decoded.customField).toBe(customPayload.customField);
        });
    });

    describe('extractJti', () => {
        it('should extract JTI from decoded token', () => {
            const { token, jti } = createToken(testPayload, '1h');
            const decoded = verifyToken(token);
            const extractedJti = extractJti(decoded);

            expect(extractedJti).toBe(jti);
        });

        it('should throw error if JTI is missing', () => {
            const decodedWithoutJti = {
                id: 'user123',
                username: 'testuser'
            };

            expect(() => {
                extractJti(decodedWithoutJti);
            }).toThrow('Token missing JTI');
        });

        it('should handle JTI in various formats', () => {
            const decoded = {
                id: 'user123',
                jti: 'some-unique-id-12345'
            };

            const extractedJti = extractJti(decoded);
            expect(extractedJti).toBe('some-unique-id-12345');
        });
    });
});

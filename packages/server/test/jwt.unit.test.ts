import base64url from 'base64url';
import crypto from 'crypto';
import { promisify } from 'util';

import { createJWT } from '../src/jwt';

const generateKeyPair = promisify(crypto.generateKeyPair);

interface Header {
  alg: 'RS256'
  typ: 'JWT'
}

interface Payload {
  iss: string
  aud: string
  scope: string
  iat: number
  exp: number
}

describe('JSON Web Token', () => {
  describe('Creating a JWT', () => {
    // https://auth0.com/docs/tokens/guides/jwt/validate-jwt#check-that-the-jwt-is-well-formed
    it('JWT Signature is valid', async () => {
      const email = 'test@getholo.dev';
      const { privateKey } = await generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      const jwt = createJWT(email, privateKey);
      const segments = jwt.split('.');
      const [header, payload, signature] = segments;

      // A JWT should consist of three parts
      expect(segments.length).toEqual(3);

      // Header should be a Base64URL Encoded JSON Object
      const parsedHeader: Header = JSON.parse(base64url.decode(header));
      expect(parsedHeader).toBeDefined();

      // Payload should be a Base64URL Encoded JSON Object
      const parsedPayload: Payload = JSON.parse(base64url.decode(payload));
      expect(parsedPayload).toBeDefined();

      // Signature should be a Base64URL Encoded String
      const parsedSignature = base64url.decode(signature);
      expect(parsedSignature).toBeDefined();

      // Algorithm should be RS256
      expect(parsedHeader.alg).toEqual('RS256');

      // Type should be JWT
      expect(parsedHeader.typ).toEqual('JWT');

      expect(parsedPayload.aud).toEqual('https://oauth2.googleapis.com/token');
      expect(parsedPayload.scope).toEqual('https://www.googleapis.com/auth/drive');
      expect(parsedPayload.iss).toEqual(email);
    });
  });
});

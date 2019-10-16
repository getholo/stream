import base64url from 'base64url';
import crypto from 'crypto';

function signRS256(data: any, key: string) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  const signature = signer.sign(key, 'base64');
  return base64url.fromBase64(signature);
}

export function createJWT(email: string, key: string) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url.encode(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT',
  }));

  const payload = base64url.encode(JSON.stringify({
    iss: email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/drive',
    iat: now,
    exp: now + 3600,
  }));

  const signature = signRS256(`${header}.${payload}`, key);
  return `${header}.${payload}.${signature}`;
}

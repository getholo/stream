import request from 'supertest';
import Koa from 'koa';

import nanoid from 'nanoid';
import {
  digestAuth,
  md5,
  basicAuth,
  auth,
} from '../src/auth';

describe('Authentication', () => {
  const params = {
    method: 'GET',
    realm: 'test@getholo.dev',
    password: 'test123',
  };

  // Params for Digest authentication
  const username = 'Test';
  const qop = 'auth';
  const nonce = nanoid(24);
  const cnonce = nanoid(24);
  const uri = '/';
  const nc = 1;

  describe('Digest Authentication', () => {
    it('When given an invalid header, digest should throw', () => {
      const digestFn = () => digestAuth({
        ...params,
        header: 'This should fail',
      });

      expect(digestFn).toThrow();
    });

    it('When given incorrect hash, digest should result in undefined', () => {
      const result = digestAuth({
        ...params,
        header: 'Digest username=Test',
      });

      expect(result).toBeUndefined();
    });

    it('When given correct hash, digest should result with username', () => {
      const hash1 = md5(`${username}:${params.realm}:${params.password}`);
      const hash2 = md5(`${params.method}:${uri}`);
      const response = md5([hash1, nonce, nc, cnonce, qop, hash2].join(':'));

      const result = digestAuth({
        ...params,
        header: `Digest username="${username}", qop="${qop}", nonce="${nonce}", nc="${nc}", cnonce="${cnonce}", uri="${uri}", response="${response}"`,
      });

      expect(result).toBeDefined();
      expect(result).toEqual(username);
    });
  });

  describe('Basic Authentication', () => {
    it('When given an invalid header, basic auth should resolve in undefined', () => {
      const result = basicAuth({
        password: params.password,
        header: 'invalid header',
      });

      expect(result).toBeUndefined();
    });

    it('When given a valid header, basic auth should resolve with username', () => {
      const result = basicAuth({
        password: params.password,
        header: `Basic ${Buffer.from(`${username}:${params.password}`).toString('base64')}`,
      });

      expect(result).toEqual(username);
    });
  });

  describe('Middleware', () => {
    const app = new Koa();
    app.use(auth(params.password, params.realm));
    const callback = app.callback();

    it('When no header is given, request should respond with status 401', async () => {
      const response = await request(callback).get('/');

      expect(response.status).toEqual(401);
    });

    describe('Digest', () => {
      it('When given an incorrect formatted header, request should result in 401', async () => {
        const response = await request(callback)
          .get('/')
          .set('Authorization', 'Digest');

        expect(response.status).toEqual(401);
      });

      it('When given correct formatted header, request should result in 404', async () => {
        const hash1 = md5(`${username}:${params.realm}:${params.password}`);
        const hash2 = md5(`${params.method}:${uri}`);
        const header = md5([hash1, nonce, nc, cnonce, qop, hash2].join(':'));

        const response = await request(callback)
          .get('/')
          .set('Authorization', `Digest username="${username}", qop="${qop}", nonce="${nonce}", nc="${nc}", cnonce="${cnonce}", uri="${uri}", response="${header}"`);

        expect(response.status).toEqual(404);
      });

      it('When given incorrect password, request should result in 401', async () => {
        const hash1 = md5(`${username}:${params.realm}:incorrectPassword`);
        const hash2 = md5(`${params.method}:${uri}`);
        const header = md5([hash1, nonce, nc, cnonce, qop, hash2].join(':'));

        const response = await request(callback)
          .get('/')
          .set('Authorization', `Digest username="${username}", qop="${qop}", nonce="${nonce}", nc="${nc}", cnonce="${cnonce}", uri="${uri}", response="${header}"`);

        expect(response.status).toEqual(401);
      });
    });

    describe('Basic', () => {
      it('When given an incorrect formatted header, request should result in 401', async () => {
        const response = await request(callback)
          .get('/')
          .set('Authorization', 'Basic');

        expect(response.status).toEqual(401);
      });

      it('When given an correct formatted header, request should result in 404', async () => {
        const response = await request(callback)
          .get('/')
          .set('Authorization', `Basic ${Buffer.from(`${username}:${params.password}`).toString('base64')}`);

        expect(response.status).toEqual(404);
      });
    });
  });
});

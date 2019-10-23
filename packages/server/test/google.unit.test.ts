import axios from 'axios';
import crypto from 'crypto';
import { promisify } from 'util';

import { getAccessToken, getStream } from '../src/google';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const generateKeyPair = promisify(crypto.generateKeyPair);

const email = 'test@getholo.dev';
const expectedToken = 'I cannot believe this, you are looking at the code!';

let key: string;

beforeAll(async () => {
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

  key = privateKey;
});

describe('Google API', () => {
  describe('Authentication', () => {
    it('When requesting a token, OAuth API should be called with correct parameters', async () => {
      mockedAxios.request.mockResolvedValueOnce({
        status: 200,
        data: {
          access_token: expectedToken,
        },
      });

      const token = await getAccessToken(email, key);

      expect(token).toEqual(expectedToken);
      expect(mockedAxios.request).toHaveBeenCalledTimes(1);

      expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'https://oauth2.googleapis.com/token',
        data: {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: expect.any(String),
        },
      }));
    });

    it('When requesting a second token, the token should be fetched from the cache', async () => {
      const token = await getAccessToken(email, key);
      expect(token).toEqual(expectedToken);
      expect(mockedAxios.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stream', () => {
    it('When requesting a stream, the Drive API should be called with the correct parameters', async () => {
      mockedAxios.request.mockResolvedValueOnce({
        status: 200,
        data: 'whatever',
      });

      const id = '123';
      const token = 'not a bearer';
      const start = 0;
      const end = 100;

      await getStream(id, start, end, token);

      expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
        url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
        responseType: 'stream',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Range: `bytes=${start}-${end}`,
        },
      }));
    });
  });
});

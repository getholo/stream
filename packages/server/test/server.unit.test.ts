import request from 'supertest';
import axios from 'axios';
import { IncomingMessage, ServerResponse } from 'http';

import { createServer } from '../src/index';

import { getAccessToken } from '../src/google';
import { DriveFile } from '../src/content';

jest.mock('../src/google');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const getToken = getAccessToken as jest.Mock;

let callback: (req: IncomingMessage, res: ServerResponse) => void;

const files: DriveFile[] = [
  {
    id: '1',
    name: 'films',
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['VA'],
  },
  {
    id: '2',
    name: 'joker-2019',
    mimeType: 'application/vnd.google-apps.folder',
    parents: ['1'],
  },
  {
    id: '3',
    name: 'joker.2019.2160p.mkv',
    mimeType: 'video/x-matroska',
    parents: ['2'],
    size: `${500 * 1024 * 1024}`,
  },
];

beforeAll(async () => {
  // mock mock, who's there?
  getToken.mockReturnValueOnce('token');
  // files
  mockedAxios.request.mockResolvedValueOnce({
    data: {
      files,
    },
  });

  // changeToken
  mockedAxios.request.mockResolvedValueOnce({
    data: {
      startPageToken: 'changeToken',
    },
  });

  const app = await createServer({
    driveId: 'VA',
    email: 'email',
    key: 'key',
    password: 'password',
    realm: 'test@getholo.dev',
  });

  callback = app.callback();
});

describe('Server Logic', () => {
  it('Path "/" should return 401 when not given Authorization header', async () => {
    const response = await request(callback)
      .propfind('/');

    expect(response.status).toEqual(401);
  });

  it('Path "/best/films" should return Joker when given Authorization header', async () => {
    const response = await request(callback)
      .propfind('/best/films')
      .auth('Test', 'password', { type: 'basic' });

    expect(response.status).toEqual(200);
    expect(response.type).toEqual('text/xml');
    expect(response.text).toMatchSnapshot();
  });
});

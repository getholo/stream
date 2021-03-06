import axios from 'axios';
import { getAccessToken } from '../../src/google';
import {
  Content,
  DriveFile,
} from '../../src/content';

jest.mock('axios');
jest.mock('../../src/google');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const getToken = getAccessToken as jest.Mock;

getToken.mockResolvedValue('token');

let content: Content;
const modifiedTime = new Date(1572698920777).toUTCString();

beforeEach(async () => {
  content = new Content({
    driveId: 'root',
    email: 'email',
    key: 'key',
  });

  const files: DriveFile[] = [
    {
      id: '1',
      mimeType: 'application/vnd.google-apps.folder',
      name: 'films',
      parents: ['root'],
      modifiedTime,
    },
    {
      id: '2',
      mimeType: 'application/vnd.google-apps.folder',
      name: 'film (year)',
      parents: ['1'],
      modifiedTime,
    },
    {
      id: '3',
      mimeType: 'video/x-matroska',
      name: 'film.year.1080p.mkv',
      parents: ['2'],
      size: '1000',
      modifiedTime,
    },
    {
      id: '4',
      mimeType: 'video/x-matroska',
      name: 'film.year.2160p.mkv',
      parents: ['2'],
      size: '1000',
      modifiedTime,
    },
  ];

  // files fetch
  mockedAxios.request.mockResolvedValueOnce({
    data: {
      files,
    },
  });

  // ChangeToken fetch
  mockedAxios.request.mockResolvedValueOnce({
    data: {
      startPageToken: 'changeToken',
    },
  });

  await content.firstFetch();
});

describe('Content: Changes', () => {
  it('Adding new files should reflect in changes', async () => {
    mockedAxios.request.mockResolvedValueOnce({
      data: {
        newStartPageToken: 'anotherChangeToken',
        changes: [
          {
            file: {
              id: '5',
              mimeType: 'application/vnd.google-apps.folder',
              modifiedTime,
              name: 'another film (year)',
              parents: ['1'],
            },
          },
          {
            file: {
              id: '6',
              mimeType: 'video/x-matroska',
              modifiedTime,
              name: 'another.film.year.2160p.mkv',
              parents: ['5'],
              size: '1000',
            },
          },
        ],
      },
    });

    await content.fetchChanges();

    expect(content.createData().films).toEqual({
      'film-year': {
        1080: {
          id: '3',
          mimeType: 'video/x-matroska',
          modifiedTime: new Date(modifiedTime).getTime(),
          size: 1000,
        },
        2160: {
          id: '4',
          mimeType: 'video/x-matroska',
          modifiedTime: new Date(modifiedTime).getTime(),
          size: 1000,
        },
      },
      'another-film-year': {
        2160: {
          id: '6',
          mimeType: 'video/x-matroska',
          modifiedTime: new Date(modifiedTime).getTime(),
          size: 1000,
        },
      },
    });
  });

  it('Removing a file should reflect in changes', async () => {
    mockedAxios.request.mockResolvedValueOnce({
      data: {
        newStartPageToken: 'holyMoleySoManyChanges',
        changes: [
          {
            file: {
              id: '4',
              mimeType: 'video/x-matroska',
              name: 'film.year.2160p.mkv',
              parents: ['2'],
              size: '1000',
              trashed: true,
              modifiedTime,
            },
          },
        ],
      },
    });

    await content.fetchChanges();

    expect(content.createData().films).toEqual({
      'film-year': {
        1080: {
          id: '3',
          mimeType: 'video/x-matroska',
          modifiedTime: new Date(modifiedTime).getTime(),
          size: 1000,
        },
      },
    });
  });
});

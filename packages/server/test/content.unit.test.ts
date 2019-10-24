import axios from 'axios';
import { getAccessToken } from '../src/google';
import { Files } from '../src/data';
import {
  fetchFiles,
  Content,
  DriveFile,
  Films,
} from '../src/content';

jest.mock('axios');
jest.mock('../src/google');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const getToken = getAccessToken as jest.Mock;

getToken.mockReturnValue('token');

describe('Content', () => {
  describe('Date fetching', () => {
    it('When fetching data from Google Drive, pageTokens should repeat the fetching', async () => {
      mockedAxios.request.mockResolvedValueOnce({
        data: {
          files: [{
            id: 1,
          }],
          nextPageToken: 'next',
        },
      });

      mockedAxios.request.mockResolvedValueOnce({
        data: {
          files: [{
            id: 2,
          }],
        },
      });

      const files = await fetchFiles('driveId', 'email', 'key');

      expect(mockedAxios.request).toBeCalledTimes(2);
      expect(getToken).toBeCalledTimes(2);
      expect(files).toEqual([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]);
    });
  });

  describe('Data backend', () => {
    it('Full system test', async () => {
      const content = new Content({
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
        },
        {
          id: '2',
          mimeType: 'application/vnd.google-apps.folder',
          name: 'film (year)',
          parents: ['1'],
        },
        {
          id: '3',
          mimeType: 'video/x-matroska',
          name: 'film.year.1080p.mkv',
          parents: ['2'],
          size: '1000',
        },
        {
          id: '4',
          mimeType: 'video/x-matroska',
          name: 'film.year.2160p.mkv',
          parents: ['2'],
          size: '1000',
        },
      ];

      mockedAxios.request.mockResolvedValueOnce({
        data: {
          files,
        },
      });

      await content.firstFetch();

      const { films } = content.createData();

      const expectedOutput: Films = {
        'film-year': {
          1080: {
            id: '3',
            mimeType: 'video/x-matroska',
            size: 1000,
          },
          2160: {
            id: '4',
            mimeType: 'video/x-matroska',
            size: 1000,
          },
        },
      };

      expect(films).toEqual(expectedOutput);
    });
  });

  describe('Oddities', () => {
    it('When teamdrive files is given as input, createData should work correctly', () => {
      // still need to write this
      const files = new Files();
      files.set('0', {
        mimeType: 'application/vnd.google-apps.folder',
        name: 'root',
        parent: null,
      });
      files.set('1', {
        mimeType: 'application/vnd.google-apps.folder',
        name: 'films',
        parent: '0',
      });
      files.set('2', {
        mimeType: 'application/vnd.google-apps.folder',
        name: 'film (year)',
        parent: '1',
      });
      files.set('3', {
        mimeType: 'video/mp4',
        name: 'film.year.1080p.mp4',
        parent: '2',
        size: 1000,
      });

      // this one should NOT show up, as it is missing the "P" in resolution
      files.set('4', {
        mimeType: 'video/mp4',
        name: 'film.year.2160.mp4',
        parent: '2',
        size: 1000,
      });

      const content = new Content({
        driveId: 'driveId',
        email: 'email',
        key: 'key',
        files,
      });

      const { films } = content.createData();
      expect(films).toEqual({
        'film-year': {
          1080: {
            id: '3',
            mimeType: 'video/mp4',
            size: 1000,
          },
        },
      });
    });
  });
});

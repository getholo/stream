import request from 'supertest';
import Koa from 'koa';

import { Films, File, Shows } from '../src/content';
import { createFolder, createFile } from '../src/webdav';
import { getAccessToken, getStream } from '../src/google';

import {
  toResolution,
  FilmsPerResolution,
  ShowsPerResolution,
  getChildren,
  parseRange,
  getVideoStream,
  Routing,
} from '../src/routes';

jest.mock('../src/google');

const getToken = getAccessToken as jest.Mock;
const fetchStream = getStream as jest.Mock;

const bladeRunner4k: File = {
  id: '1',
  mimeType: 'video/x-matroska',
  size: 50 * 1024 * 1024 * 1024,
};

const bladeRunner: File = {
  id: '2',
  mimeType: 'video/mp4',
  size: 15 * 1024 * 1024 * 1024,
};

const films: FilmsPerResolution = {
  best: {
    'blade-runner': bladeRunner4k,
  },
  2160: {
    'blade-runner': bladeRunner4k,
  },
  1080: {
    'blade-runner': bladeRunner,
  },
};

const shows: ShowsPerResolution = {
  best: {

  },
  2160: {

  },
  1080: {

  },
};

describe('Routing logic', () => {
  describe('Films to resolution-sorted films', () => {
    it('When given a Films object, best resolution should be picked', () => {
      const fileOne: File = {
        id: '1',
        size: 1000,
        mimeType: 'video/mp4',
      };

      const fileTwo: File = {
        id: '2',
        size: 2000,
        mimeType: 'video/x-matroska',
      };

      const input: Films = {
        film: {
          1080: fileOne,
          2160: fileTwo,
        },
      };

      const expected: FilmsPerResolution = {
        best: {
          film: fileTwo,
        },
        1080: {
          film: fileOne,
        },
        2160: {
          film: fileTwo,
        },
      };

      const sortedOnResolution = toResolution(input);
      expect(sortedOnResolution).toEqual(expected);
    });
  });

  describe('WebDAV routes', () => {
    it('Path "/" should list best, 2160 and 1080 resolutions', () => {
      const output = getChildren({ path: '/', films, shows });

      expect(output).toEqual([
        createFolder({ path: '/best' }),
        createFolder({ path: '/2160' }),
        createFolder({ path: '/1080' }),
      ]);
    });

    it('Path "/best" should list films and shows directory', () => {
      const output = getChildren({ path: '/best', films, shows });

      expect(output).toEqual([
        createFolder({ path: '/best/films' }),
        createFolder({ path: '/best/shows' }),
      ]);
    });

    it('Path "/2160" should list films and shows directory', () => {
      const output = getChildren({ path: '/2160', films, shows });

      expect(output).toEqual([
        createFolder({ path: '/2160/films' }),
        createFolder({ path: '/2160/shows' }),
      ]);
    });

    it('Path "/1080" should list films and shows directory', () => {
      const output = getChildren({ path: '/1080', films, shows });

      expect(output).toEqual([
        createFolder({ path: '/1080/films' }),
        createFolder({ path: '/1080/shows' }),
      ]);
    });

    it('Path "/best/films" should list 4K variant of blade-runner', () => {
      const output = getChildren({ path: '/best/films', films, shows });

      expect(output).toEqual([
        createFile({
          ...bladeRunner4k,
          path: '/best/films/blade-runner.mkv',
        }),
      ]);
    });

    it('Path "/2160/films" should list 4K variant of blade-runner', () => {
      const output = getChildren({ path: '/2160/films', films, shows });

      expect(output).toEqual([
        createFile({
          ...bladeRunner4k,
          path: '/2160/films/blade-runner.mkv',
        }),
      ]);
    });

    it('Path "/1080/films" should list HD variant of blade-runner', () => {
      const output = getChildren({ path: '/1080/films', films, shows });

      expect(output).toEqual([
        createFile({
          ...bladeRunner,
          path: '/1080/films/blade-runner.mp4',
        }),
      ]);
    });

    it('Path "/best/films/blade-runner.mkv" should list 4K variant of blade-runner', () => {
      const output = getChildren({ path: '/best/films/blade-runner.mkv', films, shows });

      expect(output).toEqual([
        createFile({
          ...bladeRunner4k,
          path: '/best/films/blade-runner.mkv',
        }),
      ]);
    });

    it('Path "/2160/films/blade-runner.mkv" should list 4K variant of blade-runner', () => {
      const output = getChildren({
        shows: undefined,
        path: '/2160/films/blade-runner.mkv',
        films,
      });

      expect(output).toEqual([
        createFile({
          ...bladeRunner4k,
          path: '/2160/films/blade-runner.mkv',
        }),
      ]);
    });

    it('Path "/1080/films/blade-runner.mp4" should list HD variant of blade-runner', () => {
      const output = getChildren({ path: '/1080/films/blade-runner.mp4', films, shows });

      expect(output).toEqual([
        createFile({
          ...bladeRunner,
          path: '/1080/films/blade-runner.mp4',
        }),
      ]);
    });

    describe('Paths that should throw', () => {
      it('/720', () => expect(getChildren({ path: '/720', films, shows })).toBeUndefined());
      it('/2160/films/bladerunner', () => expect(getChildren({ path: '/2160/films/bladerunner', films, shows })).toBeUndefined());
    });
  });

  describe('Range Header parsing', () => {
    const buffer = 50 * 1024 * 1024;

    it('With no header given, we should get the first 50MB of a file', () => {
      const size = 100 * 1024 * 1024;
      const range = parseRange(undefined, size);

      expect(range.start).toEqual(0);
      expect(range.end).toEqual(buffer);
      expect(range.contentLength).toEqual(size);
      expect(range.contentRange).toEqual(`bytes 0-${buffer}/${size}`);
    });

    it('With header given with no end, we should only get the chunk size', () => {
      const size = 100 * 1024 * 1024;
      const range = parseRange('bytes=1024-', size);

      expect(range.start).toEqual(1024);
      expect(range.end).toEqual(1024 + buffer);
      expect(range.contentLength).toEqual(size - 1024);
      expect(range.contentRange).toEqual(`bytes ${range.start}-${range.end}/${size}`);
    });

    it('With full header, we should return the asked bytes', () => {
      const size = 100 * 1024 * 1024;
      const start = 60 * 1024 * 1024;
      const range = parseRange(`bytes=${start}-${size}`, size);

      expect(range.start).toEqual(start);
      expect(range.end).toEqual(size);
      expect(range.contentLength).toEqual(size - start);
      expect(range.contentRange).toEqual(`bytes ${range.start}-${range.end}/${size}`);
    });

    it('With header given with no start, it should default to 0', () => {
      const size = 100 * 1024 * 1024;
      const range = parseRange(`bytes=-${size}`, size);

      expect(range.start).toEqual(0);
      expect(range.end).toEqual(size);
      expect(range.contentLength).toEqual(size);
      expect(range.contentRange).toEqual(`bytes ${range.start}-${range.end}/${size}`);
    });
  });

  describe('Video Stream', () => {
    it('If path does not match, then it should return as undefined', async () => {
      const response = await getVideoStream({
        rangeHeader: 'bytes=0-',
        path: '/best/shows/west-world',
        email: 'email',
        key: 'key',
        films,
        shows,
      });

      expect(getToken).not.toHaveBeenCalled();
      expect(fetchStream).not.toHaveBeenCalled();
      expect(response).toBeUndefined();
    });

    it('If film does not exist, then it should return as undefined', async () => {
      const response = await getVideoStream({
        rangeHeader: 'bytes=0-',
        path: '/best/films/toy-story.mkv',
        email: 'email',
        key: 'key',
        films,
        shows,
      });

      expect(getToken).not.toHaveBeenCalled();
      expect(fetchStream).not.toHaveBeenCalled();
      expect(response).toBeUndefined();
    });

    it('Range input should be passed to Google', async () => {
      const buffer = 50 * 1024 * 1024;

      getToken.mockReturnValueOnce('token');
      fetchStream.mockReturnValueOnce(undefined);

      const response = await getVideoStream({
        rangeHeader: 'bytes=0-',
        path: '/best/films/blade-runner.mkv',
        email: 'email',
        key: 'key',
        films,
        shows,
      });

      expect(getToken).toHaveBeenCalledTimes(1);
      expect(fetchStream).toHaveBeenCalledTimes(1);

      expect(response.stream).toBeUndefined();
      expect(response.headers).toEqual({
        'Accept-Ranges': 'bytes',
        'Content-Type': bladeRunner4k.mimeType,
        'Content-Length': `${bladeRunner4k.size}`,
        'Content-Range': `bytes 0-${buffer}/${bladeRunner4k.size}`,
      });
    });
  });

  describe('Middleware', () => {
    const inputFilms: Films = {
      'toy-story': {
        2160: {
          id: '1',
          mimeType: 'video/x-matroska',
          size: 500 * 1024 * 1024,
        },
      },
    };

    const inputShows: Shows = {
      watchmen: {
        2160: {
          1: {
            1: {
              id: '1',
              mimeType: 'video/x-matroska',
              size: 500 * 1024 * 1024,
            },
          },
        },
      },
    };

    const routing = new Routing({
      films: inputFilms,
      shows: inputShows,
      email: 'email',
      key: 'key',
    });

    const app = new Koa();
    app.use(async (ctx) => routing.middleware(ctx));
    const callback = app.callback();

    it('Path "/" should give XML output', async () => {
      const response = await request(callback)
        .propfind('/');

      expect(response.type).toEqual('text/xml');
      expect(response.status).toEqual(200);
    });

    it('Path "/4k" should resolve to 404', async () => {
      const response = await request(callback)
        .propfind('/4k');

      expect(response.status).toEqual(404);
    });

    it('METHOD other than PROPFIND or GET should resolve to 404', async () => {
      const post = await request(callback).post('/');
      expect(post.status).toEqual(404);

      const put = await request(callback).put('/');
      expect(put.status).toEqual(404);

      const del = await request(callback).delete('/');
      expect(del.status).toEqual(404);
    });

    it('GET "/best/films/toy-story.mkv" should give Stream output', async () => {
      getToken.mockReturnValueOnce('token');
      fetchStream.mockReturnValueOnce('stream');

      const response = await request(callback)
        .get('/best/films/toy-story.mkv');

      expect(response.status).toEqual(206);
      expect(response.type).toEqual('video/x-matroska');
      expect(response.get('Content-Range')).toEqual(`bytes 0-${50 * 1024 * 1024}/${500 * 1024 * 1024}`);
    });

    it('GET "/best/films/blade-runner.mkv" should resolve to 404', async () => {
      getToken.mockReturnValueOnce('token');
      fetchStream.mockReturnValueOnce('stream');

      const response = await request(callback)
        .get('/best/films/blade-runner.mkv');

      expect(response.status).toEqual(404);
    });

    it('Setting new films should update the films path', async () => {
      routing.setFilms({
        joker: {
          1080: {
            id: '2',
            mimeType: 'video/mp4',
            size: 75 * 1024 * 1024,
          },
        },
      });

      const response = await request(callback)
        .propfind('/best/films');

      expect(response.status).toEqual(200);
      expect(response.type).toEqual('text/xml');
      expect(response.text).toMatchSnapshot('joker');
    });
  });
});

import { Context } from 'koa';
import { createXML, createFile, createFolder } from './webdav';
import { Films, FilmFile, extensions } from './content';
import { getStream, getAccessToken } from './google';

import {
  matchRoot,
  matchResolution,
  matchFilms,
  matchFilmFile,
  Resolution,
} from './matchers';

export type FilmsPerResolution = {
  [key in Resolution]: {
    [film: string]: FilmFile
  }
}

export function filmsPerResolution(films: Films) {
  return Object.entries(films).reduce(
    (obj, [film, versions]) => {
      const filmsOnResolution = obj;

      if (versions['1080']) {
        filmsOnResolution['1080'][film] = versions['1080'];
        filmsOnResolution.best[film] = versions['1080'];
      }

      if (versions['2160']) {
        filmsOnResolution['2160'][film] = versions['2160'];
        filmsOnResolution.best[film] = versions['2160'];
      }

      return filmsOnResolution;
    },
    {
      best: {},
      1080: {},
      2160: {},
    } as FilmsPerResolution,
  );
}

export function getChildren(path: string, films: FilmsPerResolution) {
  if (matchRoot(path)) {
    return ['/best', '/2160', '/1080'].map(
      (folder) => createFolder({ path: folder }),
    );
  }

  const resolutionFolderMatch = matchResolution(path);
  if (resolutionFolderMatch) {
    const { resolution } = resolutionFolderMatch;
    return [`/${resolution}/films`].map(
      (folder) => createFolder({ path: folder }),
    );
  }

  const filmsFolderMatch = matchFilms(path);
  if (filmsFolderMatch) {
    const { resolution } = filmsFolderMatch;

    return Object.entries(films[resolution]).map(
      ([film, file]) => createFile({
        mimeType: file.mimeType,
        path: `/${resolution}/films/${film}${extensions[file.mimeType]}`,
        size: file.size,
      }),
    );
  }

  const filmFileMatch = matchFilmFile(path);
  if (filmFileMatch) {
    const { film: title, resolution } = filmFileMatch;
    const film = films[resolution][title];

    if (film) {
      return [
        createFile({
          mimeType: film.mimeType,
          size: film.size,
          path,
        }),
      ];
    }
  }

  return [];
}

const buffer = 50 * 1024 * 1024;

export function parseRange(range: string, size: number) {
  const [rangeStart, rangeEnd] = range
    ? range.replace('bytes=', '').split('/')[0].split('-')
    : ['0', undefined];

  const requestedStart = rangeStart ? parseInt(rangeStart, 10) : 0;
  const requestedEnd = rangeEnd && parseInt(rangeEnd, 10);

  const startWithBuffer = requestedStart + buffer;

  const start = requestedStart;
  const end = requestedEnd || startWithBuffer > size ? size : startWithBuffer;

  const contentRange = `bytes ${start}-${end}/${size}`;
  const contentLength = (requestedEnd || size) - requestedStart;

  return {
    contentRange,
    contentLength,
    start,
    end,
  };
}

interface Credentials {
  email: string
  key: string
}

interface getStreamProps extends Credentials {
  path: string
  films: FilmsPerResolution
  rangeHeader: string
}

export async function getVideoStream(props: getStreamProps) {
  const { rangeHeader, path, films } = props;

  const match = matchFilmFile(path);
  if (!match) {
    return undefined;
  }

  const { film: title, resolution } = match;

  const film = films[resolution][title];
  if (!film) {
    return undefined;
  }

  const range = parseRange(rangeHeader, film.size);

  const token = await getAccessToken(props.email, props.key);
  const stream = await getStream(film.id, range.start, range.end, token);

  return {
    stream,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Type': film.mimeType,
      'Content-Length': `${range.contentLength}`,
      'Content-Range': range.contentRange,
    },
  };
}

interface RoutingParams {
  email: string
  key: string
  films: Films
}

export class Routing {
  private films: FilmsPerResolution

  private credentials: Credentials

  constructor(params: RoutingParams) {
    this.films = filmsPerResolution(params.films);
    this.credentials = {
      email: params.email,
      key: params.key,
    };
  }

  setFilms(films: Films) {
    this.films = filmsPerResolution(films);
  }

  async middleware(ctx: Context) {
    const { path, method } = ctx;

    if (method === 'PROPFIND') {
      const children = getChildren(path, this.films);
      if (children.length < 1) {
        ctx.status = 404;
        return;
      }

      ctx.status = 200;
      ctx.body = createXML(children);
      ctx.type = 'text/xml';
      return;
    }

    if (method === 'GET') {
      const validRequest = await getVideoStream({
        ...this.credentials,
        rangeHeader: ctx.get('range'),
        films: this.films,
        path,
      });

      if (!validRequest) {
        ctx.status = 404;
        return;
      }

      const { headers, stream } = validRequest;
      console.log(`${headers['Content-Range']}`);

      ctx.body = stream;
      ctx.status = 206;
      ctx.set(headers);
      return;
    }

    ctx.status = 404;
  }
}

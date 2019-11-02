import { Context } from 'koa';
import { createXML, createFile, createFolder } from './webdav';
import { getStream, getAccessToken } from './google';
import {
  Films,
  File,
  extensions,
  Shows,
} from './content';

import {
  matchRoot,
  matchResolution,
  matchFilms,
  matchFilmFile,
  Resolution,
  matchShows,
  matchSeasonFolder,
  matchShowFolder,
  isEpisodeFile,
} from './matchers';

export type FilmsPerResolution = {
  [key in Resolution]: {
    [film: string]: File
  }
}

export type ShowItems = {
  [season: number]: {
    [episode: number]: File
  }
}

export type ShowsPerResolution = {
  [key in Resolution]: {
    [show: string]: ShowItems
  }
}

export function toResolution(input: Films): FilmsPerResolution
export function toResolution(input: Shows): ShowsPerResolution
export function toResolution(input: Shows | Films) {
  return Object.entries(input).reduce(
    (obj, [show, versions]) => {
      const output = obj;

      if (versions['1080']) {
        output['1080'][show] = versions['1080'];
        output.best[show] = versions['1080'];
      }

      if (versions['2160']) {
        output['2160'][show] = versions['2160'];
        output.best[show] = versions['2160'];
      }

      return output;
    },
    {
      best: {},
      1080: {},
      2160: {},
    },
  );
}

interface GetChildrenParams {
  path: string
  films: FilmsPerResolution
  shows: ShowsPerResolution
}

export function formatEpisode(season: number | string, episode: number | string) {
  return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}

export function getChildren({ path, films, shows }: GetChildrenParams) {
  if (matchRoot(path)) {
    return ['/best', '/2160', '/1080'].map(
      (folder) => createFolder({ path: folder }),
    );
  }

  const resolutionFolderMatch = matchResolution(path);
  if (resolutionFolderMatch) {
    const { resolution } = resolutionFolderMatch;
    return [`/${resolution}/films`, `/${resolution}/shows`].map(
      (folder) => createFolder({ path: folder }),
    );
  }

  const filmsFolderMatch = matchFilms(path);
  if (filmsFolderMatch) {
    const { resolution } = filmsFolderMatch;

    return Object.entries(films[resolution]).map(
      ([film, file]) => createFile({
        modifiedTime: file.modifiedTime,
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
          modifiedTime: film.modifiedTime,
          mimeType: film.mimeType,
          size: film.size,
          path,
        }),
      ];
    }
  }

  const showsMatch = matchShows(path);
  if (showsMatch) {
    const { resolution } = showsMatch;

    return Object.keys(shows[resolution]).map(
      (show) => createFolder({
        path: `/${resolution}/shows/${show}`,
      }),
    );
  }

  const showFolderMatch = matchShowFolder(path);
  if (showFolderMatch) {
    const { resolution, show } = showFolderMatch;

    if (!shows[resolution][show]) {
      return undefined;
    }

    return Object.keys(shows[resolution][show]).map(
      (season) => createFolder({
        path: `/${resolution}/shows/${show}/season ${season}`,
      }),
    );
  }

  const seasonFolderMatch = matchSeasonFolder(path);
  if (seasonFolderMatch) {
    const {
      resolution, season, prefix, show,
    } = seasonFolderMatch;

    if (!shows[resolution][show] || !shows[resolution][show][season]) {
      return undefined;
    }

    return Object.entries(shows[resolution][show][season]).map(
      ([episode, file]) => createFile({
        modifiedTime: file.modifiedTime,
        mimeType: file.mimeType,
        path: `/${resolution}/shows/${show}/${prefix}${season}/${show}-${formatEpisode(season, episode)}${extensions[file.mimeType]}`,
        size: file.size,
      }),
    );
  }

  return undefined;
}

export const buffer = 50 * 1024 * 1024;

export function parseRange(range: string, size: number) {
  const [rangeStart, rangeEnd] = range
    ? range.replace('bytes=', '').split('/')[0].split('-')
    : ['0', undefined];

  const requestedStart = rangeStart ? parseInt(rangeStart, 10) : 0;
  const requestedEnd = rangeEnd && parseInt(rangeEnd, 10);

  const startWithBuffer = requestedStart + buffer;

  const start = requestedStart;
  let end: number;

  if (requestedEnd) {
    end = requestedEnd;
  } else {
    end = startWithBuffer > size ? size : startWithBuffer;
  }

  const contentRange = `bytes ${start}-${end}/${size}`;
  const contentLength = size - requestedStart;

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
  shows: ShowsPerResolution
  rangeHeader: string
}

export async function getVideoStream(props: getStreamProps) {
  const {
    rangeHeader, path, films, shows,
  } = props;

  let file: File;

  const isFilm = matchFilmFile(path);
  if (isFilm) {
    const { film: title, resolution } = isFilm;

    const film = films[resolution][title];
    if (!film) {
      return undefined;
    }

    file = film;
  }

  const isShow = isEpisodeFile(path);
  if (isShow) {
    const {
      episode, resolution, show, season,
    } = isShow;

    if (!shows[resolution][show] || !shows[resolution][show][season]) {
      return undefined;
    }

    file = shows[resolution][show][season][episode];
  }

  if (!file) {
    return undefined;
  }

  const range = parseRange(rangeHeader, file.size);

  const token = await getAccessToken(props.email, props.key);
  const stream = await getStream(file.id, range.start, range.end, token);

  return {
    stream,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Type': file.mimeType,
      'Content-Length': `${range.contentLength}`,
      'Content-Range': range.contentRange,
    },
  };
}

interface RoutingParams {
  email: string
  key: string
  films: Films
  shows: Shows
}

export class Routing {
  private films: FilmsPerResolution

  private shows: ShowsPerResolution

  private credentials: Credentials

  constructor(params: RoutingParams) {
    this.films = toResolution(params.films);
    this.shows = toResolution(params.shows);
    this.credentials = {
      email: params.email,
      key: params.key,
    };
  }

  setFilms(films: Films) {
    this.films = toResolution(films);
  }

  setShows(shows: Shows) {
    this.shows = toResolution(shows);
  }

  async middleware(ctx: Context) {
    const { method } = ctx;
    const path = decodeURIComponent(ctx.path);

    if (method === 'OPTIONS') {
      ctx.status = 200;
      ctx.set({
        DAV: '1',
        'Accept-Ranges': 'bytes',
      });
      return;
    }

    if (method === 'PROPFIND') {
      const { films, shows } = this;
      const children = getChildren({ path, films, shows });

      if (!children) {
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
        shows: this.shows,
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

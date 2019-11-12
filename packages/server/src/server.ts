import findMyWay from 'find-my-way';
import http from 'http';

import streamCore, { Drive } from '@getholo/stream-core';
import { onStreamHook, resolutions, RouteParams } from './types';

import Users from './auth/users';

import { listFilms } from '~/routes/films';
import { streamEpisode, streamFilm } from '~/routes/streams';
import { listMediaFolders, listResolutions } from '~/routes/base';
import { listShows, listEpisodes, listSeasons } from '~/routes/shows';

interface Props {
  credentials: {
    email: string
    key: string
  },
  driveId: string
  patterns: {
    film: string
    show: string
  },
  hooks?: {
    onStream?: onStreamHook
  }
}

class Server {
  private drive: Drive

  public users: Users

  constructor(drive: Drive, users: Users) {
    this.drive = drive;
    this.users = users;
  }

  get films() {
    return this.drive.films;
  }

  get shows() {
    return this.drive.shows;
  }
}

export async function startServer(input: Props) {
  const drive = await streamCore(input);
  const streamHook = input.hooks && input.hooks.onStream;
  const onStream = streamHook ?? (() => {
    // empty callback
  });

  const users = new Users();

  const router = findMyWay({
    ignoreTrailingSlash: true,
  });

  const baseParams: RouteParams = {
    resolution: 'best',
    router,
    drive,
    onStream,
    users,
  };

  listResolutions(baseParams);

  for (const resolution of resolutions) {
    const params: RouteParams = {
      ...baseParams,
      resolution,
    };

    listMediaFolders(params);

    listShows(params);
    listSeasons(params);
    listEpisodes(params);

    listFilms(params);

    streamFilm(params);
    streamEpisode(params);
  }

  const server = http.createServer((req, res) => {
    console.log(req.method, req.url);
    res.setHeader('Accept-Ranges', 'bytes');
    router.lookup(req, res);
  });

  await new Promise((resolve) => server.listen(4000, resolve));

  return new Server(drive, users);
}

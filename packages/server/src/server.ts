import Koa from 'koa';
import Router from '@koa/router';

import { firstFetch, extensions, getResolution } from './content';
import { propfind, analytics, AnalyticsContext } from './middleware';
import { createFile, createXML, WebDavXML } from './webdav';
import { getAccessToken, getStream } from './google';
import { auth } from './auth';

interface FilmRouteParams {
  identifier: string
  resolution: string
}

export async function startServer(driveId: string, email: string, key: string) {
  const films = await firstFetch(driveId, email, key);
  if (!films) {
    console.log('Something went wrong scanning your Drive');
    return;
  }

  console.log(`Found ${Object.keys(films).length} films!`);

  const app = new Koa();
  const router = new Router();

  app.on('error', (error) => {
    if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
      return;
    }

    throw error;
  });

  // Authentication

  app.use(analytics);
  app.use(auth('welcome to the alpha weekend', 'alpha-one@getholo.dev'));

  // PROPFIND Routes for WEBDAV

  router.all('/', propfind(['/', '/1080', '/2160', '/best']));
  router.all('/1080', propfind(['/1080', '/1080/films']));
  router.all('/2160', propfind(['/2160', '/2160/films']));
  router.all('/best', propfind(['/best', '/best/films']));

  // This Route catches all requests to the /films directory within the resolution directories

  router.all('/:resolution/films', (ctx) => {
    const { response, params } = ctx;
    const { resolution } = params;

    if (resolution === '1080' || resolution === '2160' || resolution === 'best') {
      const filteredFilms = Object.entries(films).reduce(
        (list, [film, versions]) => {
          const { film: version } = getResolution(resolution, versions);

          if (!version) {
            return list;
          }

          const ext = extensions[version.mimeType];
          list.push(createFile({
            path: `/best/films/${film}${ext}`,
            mimeType: version.mimeType,
            size: version.size,
          }));
          return list;
        },
        [] as WebDavXML[],
      );

      const xml = createXML(filteredFilms);

      response.status = 200;
      response.type = 'text/xml';
      response.body = xml;
    }
  });

  // Route for Streaming a film

  router.all('/:resolution/films/:identifier', async (ctx: AnalyticsContext) => {
    const { identifier, resolution }: FilmRouteParams = ctx.params;
    const { request, response } = ctx;

    if (!(request.method === 'GET' || request.method === 'PROPFIND')) {
      response.status = 404;
      return;
    }

    if (!(resolution === '1080' || resolution === '2160' || resolution === 'best')) {
      response.status = 404;
      return;
    }

    const filmId = identifier.split('.')[0];
    const versions = films[filmId];

    if (!versions) {
      response.status = 404;
      return;
    }

    const { film: version, resolution: actualResolution } = getResolution(resolution, versions);

    if (!version) {
      response.status = 404;
      return;
    }

    if (request.method === 'PROPFIND') {
      const ext = extensions[version.mimeType];
      const xml = createXML([
        createFile({
          path: `/best/films/${filmId}${ext}`,
          size: version.size,
          mimeType: version.mimeType,
        }),
      ]);

      response.type = 'text/xml';
      response.body = xml;
      return;
    }

    const range = request.get('range');
    const buffer = 50 * 1024 * 1024;

    if (!range) {
      response.status = 404;
      return;
    }

    const [rangeStart, rangeEnd] = range.replace('bytes=', '').split('/')[0].split('-');
    const requestedStart = rangeStart ? parseInt(rangeStart, 10) : 0;
    const requestedEnd = rangeEnd && parseInt(rangeEnd, 10);

    const startWithBuffer = requestedStart + buffer;

    const start = requestedStart;
    const end = requestedEnd || startWithBuffer > version.size ? version.size : startWithBuffer;

    const rangeHeader = `bytes ${start}-${end}/${version.size}`;
    const length = (requestedEnd || version.size) - requestedStart;

    if (end > version.size || start >= version.size) {
      response.status = 416;
      return;
    }

    response.status = 206;
    response.set({
      'Content-Range': rangeHeader,
      'Accept-Ranges': 'bytes',
      'Content-Type': version.mimeType,
      'Content-Length': `${length}`,
    });

    ctx.state.film = filmId;
    ctx.state.resolution = actualResolution;

    const token = await getAccessToken(email, key);
    const { stream } = await getStream(version.id, start, end, token);
    response.body = stream;
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.listen(4000, () => {
    console.log('Project Stream tuning in on port 4000');
  });
}

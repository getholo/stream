import { pipeline } from 'stream';

import { RouteParams } from '~/types';
import { parseRange } from '~/utils/range';
import { withAuth } from '~/auth';

export function streamEpisode(params: RouteParams) {
  const { drive, resolution, router } = params;

  router.get(
    `/${resolution}/shows/:show/:season/:file`,
    (req, res, { show, file }) => withAuth(req, res, params.users, async (username) => {
      const { range } = req.headers;
      if (!range) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const match = /S(\d+)E(\d+)/i.exec(file);
      if (!match) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const seasonNumber = parseInt(match[1], 10);
      const episodeNumber = parseInt(match[2], 10);

      const versions = drive.shows[show];
      if (!versions) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const seasons = resolution === 'best'
        ? versions[2160] || versions[1080]
        : versions[resolution];

      const episode = seasons?.[seasonNumber]?.[episodeNumber];
      if (!episode) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const { start, end, ...headers } = parseRange(range, episode.size);

      const stream = await drive.stream({
        id: episode.id,
        start,
        end,
      });

      res.statusCode = 206;
      res.setHeader('Content-Type', episode.mimeType);
      res.setHeader('Content-Length', headers.contentLength);
      res.setHeader('Content-Range', headers.contentRange);

      pipeline(stream, res, (err) => {
        if (!err) {
          const { size } = episode;
          params.onStream({
            username,
            range: {
              start,
              end,
              size,
            },
            show: {
              title: show,
              episode: episodeNumber,
              season: seasonNumber,
              resolution,
            },
          });
        }
      });
    }),
  );
}

export function streamFilm(params: RouteParams) {
  const { drive, router, resolution } = params;

  router.get(
    `/${resolution}/films/:film`,
    (req, res, { film }) => withAuth(req, res, params.users, async (username) => {
      const { range } = req.headers;
      if (!range) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const title = film.split('.')[0];

      const versions = drive.films[title];
      if (!versions) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const file = resolution === 'best'
        ? versions[2160] || versions[1080]
        : versions[resolution];

      const { start, end, ...headers } = parseRange(range, file.size);

      const stream = await drive.stream({
        id: file.id,
        start,
        end,
      });

      res.statusCode = 206;
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', headers.contentLength);
      res.setHeader('Content-Range', headers.contentRange);

      pipeline(stream, res, (err) => {
        if (!err) {
          const { size } = file;
          params.onStream({
            username,
            range: {
              start,
              end,
              size,
            },
            film: {
              title,
              resolution,
            },
          });
        }
      });
    }),
  );
}

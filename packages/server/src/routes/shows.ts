import { extensions, RouteParams } from '~/types';
import { format } from '~/utils/episode';
import { withAuth } from '~/auth';
import {
  createFile, createFolder, createXML, WebDavXML,
} from '~/utils/webdav';

export function listShows(params: RouteParams) {
  const { drive, router, resolution } = params;

  router.propfind(
    `/${resolution}/shows`,
    (req, res) => withAuth(req, res, params.users, () => {
      const xml = Object.entries(drive.shows).reduce(
        (list, [show, versions]) => {
          const seasons = resolution === 'best'
            ? versions[2160] || versions[1080]
            : versions[resolution];

          if (seasons) {
            list.push(
              createFolder({
                path: `/${resolution}/shows/${show}`,
              }),
            );
          }

          return list;
        },
        [] as WebDavXML[],
      );

      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(createXML(xml));
    }),
  );
}

export function listSeasons(params: RouteParams) {
  const { drive, router, resolution } = params;

  router.propfind(
    `/${resolution}/shows/:show`,
    (req, res, { show }) => withAuth(req, res, params.users, () => {
      const versions = drive.shows[show];
      if (!versions) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const seasons = resolution === 'best'
        ? versions[2160] || versions[1080]
        : versions[resolution];

      const xml = createXML(
        Object.keys(seasons).map(
          (season) => createFolder({
            path: `/${resolution}/shows/${show}/season ${season}`,
          }),
        ),
      );

      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(xml);
    }),
  );
}

export function listEpisodes(params: RouteParams) {
  const { drive, router, resolution } = params;

  router.propfind(
    `/${resolution}/shows/:show/:season`,
    (req, res, { show, season }) => withAuth(req, res, params.users, () => {
      const versions = drive.shows[show];
      if (!versions) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const seasonNumber = parseInt(season.match(/\d+/)[0], 10);

      const seasons = resolution === 'best'
        ? versions[2160] || versions[1080]
        : versions[resolution];

      const episodes = seasons?.[seasonNumber];
      if (!episodes) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const xml = createXML(
        Object.entries(episodes).map(
          ([episode, file]) => createFile({
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            path: `${resolution}/shows/${show}/${season}/${show}-${format(seasonNumber, episode)}${extensions[file.mimeType]}`,
            size: file.size,
          }),
        ),
      );

      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(xml);
    }),
  );
}

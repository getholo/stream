import { createFile, createXML, WebDavXML } from '~/utils/webdav';
import { RouteParams, extensions } from '~/types';
import { withAuth } from '~/auth';

export function listFilms(params: RouteParams) {
  const { drive, router, resolution } = params;

  router.propfind(
    `/${resolution}/films`,
    (req, res) => withAuth(req, res, params.users, () => {
      const films = Object.entries(drive.films).reduce(
        (list, [film, versions]) => {
          const version = resolution === 'best'
            ? versions[2160] || versions[1080]
            : versions[resolution];

          if (version) {
            list.push(createFile({
              mimeType: version.mimeType,
              modifiedTime: version.modifiedTime,
              path: `/${resolution}/films/${film}${extensions[version.mimeType]}`,
              size: version.size,
            }));
          }

          return list;
        },
        [] as WebDavXML[],
      );

      res.writeHead(207, { 'Content-Type': 'text/xml' });
      res.end(createXML(films));
    }),
  );
}

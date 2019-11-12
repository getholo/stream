import { RouteParams } from '~/types';
import { createFolder, createXML } from '~/utils/webdav';
import { withAuth } from '~/auth';

const createMultipleFolders = (paths: string[]) => createXML(paths.map(
  (path) => createFolder({ path }),
));

export function listResolutions({ router, users }: RouteParams) {
  router.propfind(
    '/',
    (req, res) => withAuth(req, res, users, () => {
      const response = createMultipleFolders(['/best', '/1080', '/2160']);

      res.writeHead(200, {
        'Content-Type': 'text/xml',
      });
      res.end(response);
    }),
  );
}

export function listMediaFolders({ router, resolution, users }: RouteParams) {
  router.propfind(
    `/${resolution}`,
    (req, res) => withAuth(req, res, users, () => {
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(createMultipleFolders([`/${resolution}/films`, `/${resolution}/shows`]));
    }),
  );
}

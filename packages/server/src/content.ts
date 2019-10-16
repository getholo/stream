import axios from 'axios';
import { getAccessToken } from './google';

export const extensions = {
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/mp4': '.mp4',
};

interface FilmFile {
  mimeType: keyof typeof extensions
  id: string
  size: number
}

interface Versions {
  '2160': FilmFile
  '1080': FilmFile
}

interface Films {
  [name: string]: Versions
}

interface ResolutionOutput {
  film: FilmFile
  resolution: '2160' | '1080'
}

export const getResolution = (resolution: 'best' | '2160' | '1080', versions: Films[keyof Films]): ResolutionOutput => {
  if (resolution === 'best') {
    if (versions[2160]) {
      return {
        film: versions[2160],
        resolution: '2160',
      };
    }

    return {
      film: versions[1080],
      resolution: '1080',
    };
  }

  return {
    film: versions[resolution],
    resolution,
  };
};

const folderType = 'application/vnd.google-apps.folder';

interface DriveFile {
  id: string
  name: string
  mimeType: keyof typeof extensions | typeof folderType
  md5Checksum?: string
  parents: string[]
  size: string
}

interface DriveFiles {
  files: DriveFile[]
  nextPageToken?: string
}

interface DriveFileWithParent {
  id: string
  name: string
  mimeType: keyof typeof extensions | typeof folderType
  md5Checksum?: string
  parent: string
  size: string
}

export async function firstFetch(driveId: string, email: string, key: string) {
  const token = await getAccessToken(email, key);

  const driveFiles: DriveFile[] = [];
  let pageToken: string = null;

  while (pageToken !== undefined) {
    const { data } = await axios.request<DriveFiles>({
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v3/files',
      params: {
        driveId,
        corpora: 'drive',
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files/md5Checksum,files/id,files/mimeType,files/parents,files/name,files/size,nextPageToken',
        q: "trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'video/x-matroska' or mimeType = 'video/mp4')",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    driveFiles.push(...data.files);
    pageToken = data.nextPageToken;
  }

  const files: DriveFileWithParent[] = driveFiles.map((file) => {
    const { parents, ...items } = file;
    return {
      ...items,
      parent: parents[0],
    };
  });

  const filmsRootFolder = files.find(
    (file) => (
      file.parent === driveId
      && file.name === 'films'
      && file.mimeType === 'application/vnd.google-apps.folder'
    ),
  );

  if (!filmsRootFolder) {
    return undefined;
  }

  const filmFolders = files.reduce(
    (hits, file) => {
      if (file.mimeType === folderType && file.parent === filmsRootFolder.id) {
        const name = file.name.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '');

        const children = files.filter(
          ({ parent }) => parent === file.id,
        );

        const versions = children.reduce(
          (otherVersions, child) => {
            const test = child.name.match(/[. -]((1080)|(2160))p[. -]/);
            if (test && child.mimeType !== 'application/vnd.google-apps.folder') {
              const resolution = test[1] as '2160' | '1080';
              const version: FilmFile = {
                id: child.id,
                mimeType: child.mimeType,
                size: parseInt(child.size, 10),
              };

              return {
                ...otherVersions,
                [resolution]: version,
              };
            }

            return otherVersions;
          },
          {} as Versions,
        );

        return {
          ...hits,
          [name]: versions,
        };
      }

      return hits;
    },
    {} as Films,
  );

  return filmFolders;
}

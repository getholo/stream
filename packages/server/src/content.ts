import axios from 'axios';
import { getAccessToken } from './google';
import { Files } from './data';
import { generateFilmExp, generateShowExp } from './paths';

export const extensions = {
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/mp4': '.mp4',
};

export interface DriveFile {
  id: string
  name: string
  mimeType: keyof typeof extensions | 'application/vnd.google-apps.folder'
  md5Checksum?: string
  parents: string[]
  size?: string
}

interface DriveFiles {
  files: DriveFile[]
  nextPageToken?: string
}

export async function fetchFiles(driveId: string, email: string, key: string) {
  const files: DriveFile[] = [];
  let pageToken: string = null;

  while (pageToken !== undefined) {
    const token = await getAccessToken(email, key);
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
        pageToken,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    files.push(...data.files);
    pageToken = data.nextPageToken;
  }

  return files;
}

export interface FilmFile {
  mimeType: keyof typeof extensions
  id: string
  size: number
}

interface Versions {
  '2160'?: FilmFile
  '1080'?: FilmFile
}

export interface Films {
  [name: string]: Versions
}

export interface DriveParams {
  driveId: string
  email: string
  key: string
  files?: Files
  showRegex?: string
  filmRegex?: string
}

export class Content {
  private files: Files;

  private config: DriveParams;

  constructor(params: DriveParams) {
    this.config = {
      ...params,
      filmRegex: params.filmRegex || '/films/:film/:file',
      showRegex: params.showRegex || '/shows/:show/:season/:episode',
    };

    if (params.files) {
      this.files = params.files;
    } else {
      this.files = new Files();
    }
  }

  async firstFetch() {
    this.files.clear();

    const { driveId, email, key } = this.config;

    this.files.set(driveId, {
      name: 'Shared Drive',
      parent: null,
    });

    const allFiles = await fetchFiles(driveId, email, key);
    for (const file of allFiles) {
      this.files.set(file.id, {
        name: file.name,
        parent: file.parents[0],
        mimeType: file.mimeType,
        size: parseInt(file.size, 10),
      });
    }
  }

  createData() {
    const paths = this.files.paths();

    const { filmRegex, showRegex } = this.config;

    const films: Films = {};

    const matchFilm = generateFilmExp(filmRegex);
    const matchShow = generateShowExp(showRegex);

    for (const [id, path] of paths) {
      const isFilm = matchFilm(path);
      const isShow = matchShow(path); // <= future work

      if (isFilm) {
        const { file, film } = isFilm;
        const name = film.toLowerCase().replace(/ /g, '-').replace(/[^-\w]/g, '');
        const matchResolution = file.match(/((1080)|(2160))p/);
        const { mimeType, size } = this.files.get(id);

        if (matchResolution && (mimeType === 'video/mp4' || mimeType === 'video/x-matroska')) {
          const resolution = matchResolution[1] as '2160' | '1080';
          if (!films[name]) {
            films[name] = {};
          }

          films[name][resolution] = {
            id,
            mimeType,
            size,
          };
        }
      }
    }

    return {
      films,
    };
  }
}

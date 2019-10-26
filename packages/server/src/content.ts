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
  trashed?: boolean
}

interface DriveFiles {
  files: DriveFile[]
  nextPageToken?: string
}

interface FetchFilesProps {
  driveId: string
  email: string
  key: string
}

export async function fetchFiles(props: FetchFilesProps) {
  const files: DriveFile[] = [];
  let pageToken: string = null;

  while (pageToken !== undefined) {
    const token = await getAccessToken(props.email, props.key);
    const { data } = await axios.request<DriveFiles>({
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v3/files',
      params: {
        driveId: props.driveId,
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

interface ChangeToken {
  startPageToken: string
}

export async function fetchStartChangeToken(props: FetchFilesProps) {
  const token = await getAccessToken(props.email, props.key);
  const { data } = await axios.request<ChangeToken>({
    method: 'GET',
    url: 'https://www.googleapis.com/drive/v3/changes/startPageToken',
    params: {
      driveId: props.driveId,
      supportsAllDrives: true,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.startPageToken;
}

export interface Change {
  file: DriveFile
  time: string
}

interface Changes {
  nextPageToken: string
  newStartPageToken: string
  changes: Change[]
}

interface FetchChangesProps extends FetchFilesProps {
  changeToken: string
}

export async function fetchChanges(props: FetchChangesProps) {
  const changes: Change[] = [];
  let pageToken = props.changeToken;
  let newChangeToken: string;

  while (pageToken !== undefined) {
    const token = await getAccessToken(props.email, props.key);
    const { data } = await axios.request<Changes>({
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v3/changes',
      params: {
        driveId: props.driveId,
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'changes/file/trashed,changes/file/md5Checksum,changes/file/id,changes/file/mimeType,changes/file/parents,changes/file/name,changes/file/size,changes/time,nextPageToken,newStartPageToken',
        pageToken,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    changes.push(...data.changes);
    pageToken = data.nextPageToken;
    newChangeToken = data.newStartPageToken;
  }

  return {
    changes,
    newChangeToken,
  };
}

export interface FilmFile {
  mimeType: keyof typeof extensions
  id: string
  size: number
}

export interface Versions {
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

  private changeToken: string;

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

    this.files.set(this.config.driveId, {
      name: 'Shared Drive',
      parent: null,
    });

    const allFiles = await fetchFiles(this.config);

    for (const file of allFiles) {
      this.files.set(file.id, {
        name: file.name,
        parent: file.parents[0],
        mimeType: file.mimeType,
        size: parseInt(file.size, 10),
      });
    }

    this.changeToken = await fetchStartChangeToken(this.config);
    // fetch StartPageToken
  }

  async fetchChanges() {
    const { changeToken } = this;

    const { changes, newChangeToken } = await fetchChanges({
      ...this.config,
      changeToken,
    });

    this.changeToken = newChangeToken;

    for (const change of changes) {
      const { file } = change;

      if (file.trashed) {
        this.files.delete(file.id);
      } else {
        this.files.set(file.id, {
          name: file.name,
          parent: file.parents[0],
          mimeType: file.mimeType,
          size: parseInt(file.size, 10),
        });
      }
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

import { withCredentials, Credentials } from '../types/drive';
import { Films, Shows } from '../types/content';

import { stream, streamProps } from './stream';
import { fetch } from './fetch';
import { fetchChanges, newState } from './changes';
import { Files } from '../utils/data';
import { getEpisodeDetails } from '../utils/episode';

import { generateFilmExp, generateShowExp } from '../utils/paths';

interface Props {
  driveId: string
  state?: string
  patterns: {
    film: string
    show: string
  }
}

interface withFiles {
  files: Files
}

export class Drive {
  private credentials: Credentials

  private driveId: string

  private state: string

  private files: Files;

  private patterns: {
    film: ReturnType<typeof generateFilmExp>
    show: ReturnType<typeof generateShowExp>
  }

  public films: Films

  public shows: Shows

  public async stream(props: streamProps) {
    return stream({
      credentials: this.credentials,
      ...props,
    });
  }

  private createContent() {
    const { files, patterns } = this;
    const paths = this.files.paths();

    const films: Films = {};
    const shows: Shows = {};

    for (const [id, path] of paths) {
      const isFilm = patterns.film(path);
      const isEpisode = patterns.show(path);

      if (isFilm) {
        const { file, film } = isFilm;
        const name = film.toLowerCase().replace(/ /g, '-').replace(/[^-\w]/g, '');
        const matchResolution = file.match(/((1080)|(2160))p/);
        const { mimeType, size, modifiedTime } = files.get(id);

        if (matchResolution && (mimeType === 'video/mp4' || mimeType === 'video/x-matroska')) {
          const resolution = matchResolution[1] as '2160' | '1080';
          if (!films[name]) {
            films[name] = {};
          }

          films[name][resolution] = {
            id,
            mimeType,
            modifiedTime,
            size,
          };
        }
      }

      if (isEpisode) {
        const { episode: file, show } = isEpisode;
        const title = show.toLowerCase().replace(/ /g, '-').replace(/[^-\w]/g, '');

        const matchResolution = file.match(/((1080)|(2160))p/);
        const details = getEpisodeDetails(file);
        const { mimeType, size, modifiedTime } = files.get(id);

        if (matchResolution && details && (mimeType === 'video/mp4' || mimeType === 'video/x-matroska')) {
          const { episode, season } = details;
          const resolution = matchResolution[1] as '2160' | '1080';
          if (!shows[title]) {
            shows[title] = {};
          }

          if (!shows[title][resolution]) {
            shows[title][resolution] = {};
          }

          if (!shows[title][resolution][season]) {
            shows[title][resolution][season] = {};
          }

          shows[title][resolution][season][episode] = {
            id,
            mimeType,
            modifiedTime,
            size,
          };
        }
      }
    }

    this.films = films;
    this.shows = shows;
  }

  constructor(props: Props & withCredentials & withFiles) {
    this.credentials = props.credentials;
    this.driveId = props.driveId;
    this.state = props.state;
    this.files = props.files;
    this.patterns = {
      film: generateFilmExp(props.patterns.film),
      show: generateShowExp(props.patterns.show),
    };

    this.createContent();

    setInterval(
      async () => {
        const { credentials, driveId, state } = this;
        const { changes, newChangeToken } = await fetchChanges({
          credentials, driveId, state,
        });

        this.state = newChangeToken;
        for (const change of changes) {
          const { id, ...file } = change;

          if (change.trashed) {
            this.files.delete(change.id);
          } else {
            this.files.set(id, file);
          }
        }

        this.createContent();
      },
      60 * 1000,
    );
  }
}

export async function createDrive(props: Props & withCredentials) {
  const files = new Files();
  const driveFiles = await fetch(props);
  const state = await newState(props);

  files.set(props.driveId, {
    name: 'Shared Drive',
    parent: null,
  });

  for (const file of driveFiles) {
    files.set(file.id, {
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      name: file.name,
      parent: file.parent,
      size: file.size,
    });
  }

  return new Drive({ ...props, files, state });
}

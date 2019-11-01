import { FilmsPerResolution, ShowsPerResolution, ShowItems } from '../../src/routes';
import { File } from '../../src/content';

/*
Cool future additions:
- Implement some sort of "random" File generator function
- Dynamically create `best`
*/

const fileHDR: File = {
  id: '1',
  mimeType: 'video/x-matroska',
  size: 50 * 1024 * 1024 * 1024,
};

const fileHD: File = {
  id: '2',
  mimeType: 'video/mp4',
  size: 15 * 1024 * 1024 * 1024,
};

const file4K: File = {
  id: '3',
  mimeType: 'video/x-matroska',
  size: 25 * 1024 * 1024 * 1024,
};

export const films: FilmsPerResolution = {
  best: { 'blade-runner': fileHDR },
  2160: { 'blade-runner': fileHDR },
  1080: { 'blade-runner': fileHD },
};

const westworldHDR: ShowItems = {
  1: {
    1: fileHDR,
  },
};

const westworld: ShowItems = {
  2: {
    3: fileHD,
  },
  1: {
    2: fileHDR,
  },
};

const watchmen: ShowItems = {
  1: {
    1: file4K,
    2: {
      id: '102',
      mimeType: 'video/x-matroska',
      size: 50 * 1024 * 512,
    },
  },
};

export const shows: ShowsPerResolution = {
  best: { westworld: westworldHDR },
  2160: { westworld: westworldHDR },
  1080: {
    westworld,
    watchmen,
  },
};

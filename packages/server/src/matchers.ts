import pathToRegExp from 'path-to-regexp';

export type Resolution = 'best' | '2160' | '1080'

export function matchRoot(path: string) {
  const exp = pathToRegExp('/');

  const match = exp.exec(path);
  if (match) {
    return true;
  }

  return undefined;
}

const matchResolutionExp = pathToRegExp('/:resolution(1080|2160|best)');

export function matchResolution(path: string) {
  const match = matchResolutionExp.exec(path);
  if (match) {
    return {
      resolution: match[1] as Resolution,
    };
  }

  return undefined;
}

const matchFilmsExp = pathToRegExp('/:resolution(1080|2160|best)/films');

export function matchFilms(path: string) {
  const match = matchFilmsExp.exec(path);
  if (match) {
    return {
      resolution: match[1] as Resolution,
    };
  }

  return undefined;
}

const matchShowsExp = pathToRegExp('/:resolution(1080|2160|best)/shows');

export function matchShows(path: string) {
  const match = matchShowsExp.exec(path);
  if (match) {
    return {
      resolution: match[1] as Resolution,
    };
  }

  return undefined;
}

const filmStreamExp = pathToRegExp('/:resolution(1080|2160|best)/films/:film');

export function matchFilmFile(path: string) {
  const match = filmStreamExp.exec(path);
  if (match) {
    return {
      resolution: match[1] as Resolution,
      film: match[2].split('.')[0],
    };
  }

  return undefined;
}

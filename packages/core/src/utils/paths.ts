import pathToRegExp from 'path-to-regexp';

interface FilmObj {
  film: number
  file: number
}

export function generateFilmExp(input: string) {
  const tokens = pathToRegExp.parse(input);
  const expression = pathToRegExp(input);

  const locations = tokens.reduce(
    (list, token, index) => {
      if (typeof token === 'string') {
        return list;
      }

      if (token.name === 'film') {
        if (list.film) {
          throw new Error('Film given multiple times');
        }

        return {
          ...list,
          film: index,
        };
      }

      if (token.name === 'file') {
        if (list.file) {
          throw new Error('File given multiple times');
        }

        return {
          ...list,
          file: index,
        };
      }

      return list;
    },
    {} as FilmObj,
  );

  if (!locations.file) {
    throw new Error('File parameter not given');
  }

  if (!locations.film) {
    throw new Error('Film parameter not given');
  }

  return (path: string) => {
    const match = expression.exec(path);
    if (!match) {
      return undefined;
    }

    return {
      film: match[locations.film],
      file: match[locations.file],
    };
  };
}

interface ShowObj {
  show: number
  episode: number
}

export function generateShowExp(input: string) {
  const tokens = pathToRegExp.parse(input);
  const expression = pathToRegExp(input);

  const locations = tokens.reduce(
    (list, token, index) => {
      if (typeof token === 'string') {
        return list;
      }

      if (token.name === 'show') {
        if (list.show) {
          throw new Error('Show given multiple times');
        }

        return {
          ...list,
          show: index,
        };
      }

      if (token.name === 'episode') {
        if (list.episode) {
          throw new Error('Episode given multiple times');
        }

        return {
          ...list,
          episode: index,
        };
      }

      return list;
    },
    {} as ShowObj,
  );

  if (!locations.episode) {
    throw new Error('Episode parameter not given');
  }

  if (!locations.show) {
    throw new Error('Show parameter not given');
  }

  return (path: string) => {
    const match = expression.exec(path);
    if (!match) {
      return undefined;
    }

    return {
      show: match[locations.show],
      episode: match[locations.episode],
    };
  };
}

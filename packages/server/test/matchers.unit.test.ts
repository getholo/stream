import {
  matchRoot,
  matchResolution,
  matchFilms,
  matchShows,
  matchFilmFile,
  getEpisodeDetails,
} from '../src/matchers';

describe('Route Matchers', () => {
  describe('Root Folder Matcher', () => {
    it('When given path "/", matcher should return truthy', () => {
      expect(matchRoot('/')).toBeTruthy();
    });

    // note: "//" return True, appears to be normal behaviour on the internet
    it('When given any other path, matcher should return falsy', () => {
      expect(matchRoot('')).toBeFalsy();
      expect(matchRoot('/hello')).toBeFalsy();
      expect(matchRoot('///')).toBeFalsy();
    });
  });

  describe('Resolution Folder Matcher', () => {
    it('When given path "/best", matcher should return resolution', () => {
      expect(matchResolution('/best')).toBeTruthy();
      expect(matchResolution('/best').resolution).toEqual('best');
    });

    it('When given path "/1080", matcher should return resolution', () => {
      expect(matchResolution('/1080')).toBeTruthy();
      expect(matchResolution('/1080').resolution).toEqual('1080');
    });

    it('When given path "/2160", matcher should return resolution', () => {
      expect(matchResolution('/2160')).toBeTruthy();
      expect(matchResolution('/2160').resolution).toEqual('2160');
    });

    it('When given any other path, matcher should return falsy', () => {
      expect(matchResolution('/1080p')).toBeFalsy();
      expect(matchResolution('/2160p')).toBeFalsy();
      expect(matchResolution('/4k')).toBeFalsy();

      expect(matchResolution('/2160/hello')).toBeFalsy();
      expect(matchResolution('/')).toBeFalsy();
    });
  });

  describe('Films Folder Matcher', () => {
    it('When given path "/best/films", matcher should return resolution', () => {
      expect(matchFilms('/best/films')).toBeTruthy();
      expect(matchFilms('/best/films').resolution).toEqual('best');
    });

    it('When given path "/1080/films", matcher should return resolution', () => {
      expect(matchFilms('/1080/films')).toBeTruthy();
      expect(matchFilms('/1080/films').resolution).toEqual('1080');
    });

    it('When given path "/2160/films", matcher should return resolution', () => {
      expect(matchFilms('/2160/films')).toBeTruthy();
      expect(matchFilms('/2160/films').resolution).toEqual('2160');
    });

    it('When given any other path, matcher should return falsy', () => {
      expect(matchFilms('/')).toBeFalsy();

      expect(matchFilms('/2160')).toBeFalsy();
      expect(matchFilms('/1080')).toBeFalsy();
      expect(matchFilms('/best')).toBeFalsy();

      expect(matchFilms('/best/shows')).toBeFalsy();
      expect(matchFilms('/best/films/film')).toBeFalsy();
    });
  });

  describe('Shows Folder Matcher', () => {
    it('When given path "/best/shows", matcher should return resolution', () => {
      expect(matchShows('/best/shows')).toBeTruthy();
      expect(matchShows('/best/shows').resolution).toEqual('best');
    });

    it('When given path "/1080/shows", matcher should return resolution', () => {
      expect(matchShows('/1080/shows')).toBeTruthy();
      expect(matchShows('/1080/shows').resolution).toEqual('1080');
    });

    it('When given path "/2160/shows", matcher should return resolution', () => {
      expect(matchShows('/2160/shows')).toBeTruthy();
      expect(matchShows('/2160/shows').resolution).toEqual('2160');
    });

    it('When given any other path, matcher should return falsy', () => {
      expect(matchShows('/')).toBeFalsy();

      expect(matchShows('/2160')).toBeFalsy();
      expect(matchShows('/1080')).toBeFalsy();
      expect(matchShows('/best')).toBeFalsy();

      expect(matchShows('/best/films')).toBeFalsy();
      expect(matchShows('/best/shows/show')).toBeFalsy();
    });
  });

  describe('Film File Matcher', () => {
    it('When given path "/best/films/film.ext", matcher should return resolution and title', () => {
      const match = matchFilmFile('/best/films/film.ext');

      expect(match).toBeTruthy();
      expect(match.film).toEqual('film');
      expect(match.resolution).toEqual('best');
    });

    it('When given path "/1080/films/film 2.ext", matcher should return resolution and title', () => {
      const match = matchFilmFile('/1080/films/film 2.ext');

      expect(match).toBeTruthy();
      expect(match.film).toEqual('film 2');
      expect(match.resolution).toEqual('1080');
    });

    it('When given path "/2160/films/film 3.ext", matcher should return resolution and title', () => {
      const match = matchFilmFile('/2160/films/film 3.ext');

      expect(match).toBeTruthy();
      expect(match.film).toEqual('film 3');
      expect(match.resolution).toEqual('2160');
    });

    it('When given any other path, matcher should return falsy', () => {
      expect(matchFilmFile('/')).toBeFalsy();
      expect(matchFilmFile('/2160')).toBeFalsy();
      expect(matchFilmFile('/best/films')).toBeFalsy();
      expect(matchFilmFile('/best/shows/show')).toBeFalsy();
      expect(matchFilmFile('/best/films/film/file')).toBeFalsy();
    });
  });

  describe('Episode Details matcher', () => {
    it('When given file "Watchmen.S01E01.mkv", matcher should return season 1, episode 1', () => {
      const match = getEpisodeDetails('Watchmen.S01E01.mkv');

      expect(match).toBeTruthy();
      expect(match.season).toEqual(1);
      expect(match.episode).toEqual(1);
    });

    it('When given file "The.Simpsons.S31E04.mkv", matcher should return season 31, episode 4', () => {
      const match = getEpisodeDetails('The.Simpsons.S31E04.mkv');

      expect(match).toBeTruthy();
      expect(match.season).toEqual(31);
      expect(match.episode).toEqual(4);
    });

    it('When given any other pattern, matcher should return falsy', () => {
      expect(getEpisodeDetails('The.Simpsons.episode.1.season.2')).toBeFalsy();
      expect(getEpisodeDetails('The.Simpsons.E02S02')).toBeFalsy();
    });
  });
});

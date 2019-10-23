import { generateFilmExp, generateShowExp } from '../src/paths';

describe('Path matching', () => {
  describe('CloudBox', () => {
    it('Cloudbox Movies path', () => {
      const matcher = generateFilmExp('/Media/Movies/:film/:file');

      expect(matcher('/Media/Movies/Movie Name (year)/movie file.ext')).toEqual({
        file: 'movie file.ext',
        film: 'Movie Name (year)',
      });
    });

    it('Cloudbox Movies path with resolution folder', () => {
      const matcher = generateFilmExp('/Media/Movies/:resolution/:film/:file');

      expect(matcher('/Media/Movies/1080p/Movie Name (year)/movie file.ext')).toEqual({
        file: 'movie file.ext',
        film: 'Movie Name (year)',
      });
    });

    it('Cloudbox Movies path with decade folder', () => {
      const matcher = generateFilmExp('/Media/Movies/:decade/:film/:file');

      expect(matcher('/Media/Movies/70s/Movie Name (year)/movie file.ext')).toEqual({
        file: 'movie file.ext',
        film: 'Movie Name (year)',
      });
    });

    it('Cloudbox TV path', () => {
      const matcher = generateShowExp('/Media/TV/:show/:season/:episode');

      expect(matcher('/Media/TV/TV Show Name/Season 00/episode file.ext')).toEqual({
        episode: 'episode file.ext',
        show: 'TV Show Name',
      });
    });
  });

  describe('Recommended', () => {
    it('Recommended Films path', () => {
      const matcher = generateFilmExp('/films/:film/:file');

      expect(matcher('/films/film-name-year/film-file.ext')).toEqual({
        file: 'film-file.ext',
        film: 'film-name-year',
      });
    });

    it('Recommended Shows path', () => {
      const matcher = generateShowExp('/shows/:show/:season/:episode');

      expect(matcher('/shows/show-name-year/season 1/episode-file.ext')).toEqual({
        episode: 'episode-file.ext',
        show: 'show-name-year',
      });
    });
  });

  describe('Bad Inputs', () => {
    it('When given multiple inputs, generator should throw', () => {
      expect(() => generateFilmExp('/films/:film/:film/:file')).toThrow();
      expect(() => generateFilmExp('/films/:film/:file/:file')).toThrow();

      expect(() => generateShowExp('/shows/:show/:show/:episode')).toThrow();
      expect(() => generateShowExp('/shows/:show/:episode/:episode')).toThrow();
    });

    it('When missing inputs, generator should throw', () => {
      expect(() => generateFilmExp('/films/:film')).toThrow();
      expect(() => generateFilmExp('/films/:file')).toThrow();

      expect(() => generateShowExp('/shows/:show')).toThrow();
      expect(() => generateShowExp('/shows/:episode')).toThrow();
    });

    it('When given non-matching path, matcher should return undefined', () => {
      const filmMatcher = generateFilmExp('/films/:film/:file');
      const showMatcher = generateShowExp('/shows/:show/:season/:episode');

      expect(filmMatcher('/test')).toBeUndefined();
      expect(showMatcher('/test')).toBeUndefined();
    });
  });
});

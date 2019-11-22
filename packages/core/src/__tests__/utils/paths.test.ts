import { generateFilmExp, generateShowExp } from '~/utils/paths';

interface testFilmExpParams {
  exp: string
  input: string
  film: string
  file: string
}

function testFilmExp(params: testFilmExpParams) {
  it(params.exp, () => {
    const expression = generateFilmExp(params.exp);

    const { file, film } = expression(params.input);
    expect(film).toMatch(params.film);
    expect(file).toMatch(params.file);
  });
}

interface testShowExpParams {
  exp: string
  input: string
  show: string
  episode: string
}

function testShowExp(params: testShowExpParams) {
  it(params.exp, () => {
    const expression = generateShowExp(params.exp);

    const { show, episode } = expression(params.input);
    expect(show).toMatch(params.show);
    expect(episode).toMatch(params.episode);
  });
}

describe('Default', () => {
  testFilmExp({
    // Default path for films
    exp: '/films/:film/:file',
    input: '/films/once-upon-a-time-in-hollywood-2019/once.upon.a.time.in.hollywood.2019.2160p.mkv',
    film: 'once-upon-a-time-in-hollywood-2019',
    file: 'once.upon.a.time.in.hollywood.2019.2160p.mkv',
  });

  testShowExp({
    // Default path for shows
    exp: '/shows/:show/:season/:episode',
    input: '/shows/westworld/01/westworld.s01e02.2160p.mkv',
    show: 'westworld',
    episode: 'westworld.s01e02.2160p.mkv',
  });
});

describe('CloudBox', () => {
  testFilmExp({
    // CloudBox Common Path for Movies
    exp: '/Media/Movies/:film/:file',
    input: '/Media/Movies/Joker (2019)/joker.2019.1080p.mkv',
    film: 'Joker (2019)',
    file: 'joker.2019.1080p.mkv',
  });

  testFilmExp({
    // CloudBox Common Path for Movies (including Resolution folders)
    exp: '/Media/Movies/:resolution/:film/:file',
    input: '/Media/Movies/1080p/Joker (2019)/joker.2019.1080p.mkv',
    film: 'Joker (2019)',
    file: 'joker.2019.1080p.mkv',
  });

  testFilmExp({
    // CloudBox Common Path for Movies (including Decade folders)
    exp: '/Media/Movies/:decade/:film/:file',
    input: '/Media/Movies/90s/Joker (2019)/joker.2019.1080p.mkv',
    film: 'Joker (2019)',
    file: 'joker.2019.1080p.mkv',
  });

  testShowExp({
    // CloudBox Common Path for TV
    exp: '/Media/TV/:show/:season/:episode',
    input: '/Media/TV/Watchmen/Season 1/watchmen.S01E01.1080p.mkv',
    show: 'Watchmen',
    episode: 'watchmen.S01E01.1080p.mkv',
  });

  testShowExp({
    // CloudBox Common Path for TV (including Resolution folders)
    exp: '/Media/TV/:resolution/:show/:season/:episode',
    input: '/Media/TV/1080p/Watchmen/Season 1/watchmen.S01E01.1080p.mkv',
    show: 'Watchmen',
    episode: 'watchmen.S01E01.1080p.mkv',
  });
});

function filmShouldNotMatch(params: { exp: string, input: string }) {
  it(`${params.input} => ${params.exp}`, () => {
    const expression = generateFilmExp(params.exp);

    const match = expression(params.input);
    expect(match).toBeUndefined();
  });
}

function showShouldNotMatch(params: { exp: string, input: string }) {
  it(`${params.input} => ${params.exp}`, () => {
    const expression = generateShowExp(params.exp);

    const match = expression(params.input);
    expect(match).toBeUndefined();
  });
}

describe('Should not match', () => {
  filmShouldNotMatch({
    // Different root dir should cause the match to fail
    exp: '/films/:film/:file',
    input: '/movies/once-upon-a-time-in-hollywood-2019/once.upon.a.time.in.hollywood.2019.2160p.mkv',
  });

  filmShouldNotMatch({
    // Film and file are located in another folder, thus should not match
    exp: '/Media/Movies/:film/:file',
    input: '/Media/Movies/1080/Joker (2019)/joker.2019.1080p.mkv',
  });

  showShouldNotMatch({
    // Different root dir should cause the match to fail
    exp: '/shows/:show/:season/:episode',
    input: '/tv/westworld/01/westworld.s01e02.2160p.mkv',
  });

  showShouldNotMatch({
    // No resolution folder given should cause the match to fail
    exp: '/Media/TV/:resolution/:show/:season/:episode',
    input: '/Media/TV/Watchmen/Season 1/watchmen.S01E01.1080p.mkv',
  });
});

function filmShouldThrow(exp: string) {
  it(`${exp} => Error`, () => {
    expect(() => generateFilmExp(exp)).toThrow();
  });
}

function showShouldThrow(exp: string) {
  it(`${exp} => Error`, () => {
    expect(() => generateShowExp(exp)).toThrow();
  });
}

describe('Should Throw', () => {
  filmShouldThrow('/films/:film/:film/:file');
  filmShouldThrow('/films/:film/:file/:file');
  filmShouldThrow('/films/:film');
  filmShouldThrow('/films/:file');

  showShouldThrow('/shows/:show/:show/:episode');
  showShouldThrow('/shows/:show/:episode/:episode');
  showShouldThrow('/shows/:show');
  showShouldThrow('/shows/:episode');
});

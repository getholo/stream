import { File, Films, Shows } from '../../src/content';
import {
  formatEpisode,
  toResolution,
  FilmsPerResolution,
  ShowsPerResolution,
} from '../../src/routes';

describe('Organise content on resolution', () => {
  const one: File = {
    id: '1',
    size: 1000,
    mimeType: 'video/mp4',
    modifiedTime: Date.now(),
  };

  const two: File = {
    id: '2',
    size: 2000,
    mimeType: 'video/x-matroska',
    modifiedTime: Date.now(),
  };

  it('Films with 2160p as best', () => {
    const input: Films = {
      film: {
        1080: one,
        2160: two,
      },
    };

    const expectedOutput: FilmsPerResolution = {
      best: { film: two },
      2160: { film: two },
      1080: { film: one },
    };

    const output = toResolution(input);
    expect(output).toEqual(expectedOutput);
  });

  it('Films with 1080p as best', () => {
    const input: Films = {
      film: {
        1080: one,
      },
    };

    const expectedOutput: FilmsPerResolution = {
      best: { film: one },
      1080: { film: one },
      2160: {},
    };

    const output = toResolution(input);
    expect(output).toEqual(expectedOutput);
  });

  it('Shows with 2160p as best', () => {
    const input: Shows = {
      show: {
        2160: {
          1: {
            1: two,
          },
        },
        1080: {
          1: {
            1: one,
          },
        },
      },
    };

    const expectedOutput: ShowsPerResolution = {
      best: { show: { 1: { 1: two } } },
      2160: { show: { 1: { 1: two } } },
      1080: { show: { 1: { 1: one } } },
    };

    const output = toResolution(input);
    expect(output).toEqual(expectedOutput);
  });
});

describe('Correctly format the Episode and Season slug', () => {
  it('Season 1, Episode 1 => S01E01', () => {
    expect(formatEpisode(1, 1)).toEqual('S01E01');
  });

  it('Season 100, Episode 10 => S100E10', () => {
    expect(formatEpisode(100, 10)).toEqual('S100E10');
  });

  it('Season 2, Episode 232 => S02E232', () => {
    expect(formatEpisode('2', '232')).toEqual('S02E232');
  });
});

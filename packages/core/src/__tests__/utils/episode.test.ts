import { getEpisodeDetails } from '~/utils/episode';

describe('episode details', () => {
  it('S01E01 => 1, 1', () => {
    expect(getEpisodeDetails('S01E01')).toEqual({
      season: 1,
      episode: 1,
    });
  });

  it('S2E3 => 2, 3', () => {
    expect(getEpisodeDetails('S2E3')).toEqual({
      season: 2,
      episode: 3,
    });
  });

  it('S23E46 => 23, 46', () => {
    expect(getEpisodeDetails('S23E46')).toEqual({
      season: 23,
      episode: 46,
    });
  });

  it('S123E456 => 123, 456', () => {
    expect(getEpisodeDetails('S123E456')).toEqual({
      season: 123,
      episode: 456,
    });
  });

  it('SE => undefined', () => {
    expect(getEpisodeDetails('SE')).toBeUndefined();
  });

  it('S01E => undefined', () => {
    expect(getEpisodeDetails('S01E')).toBeUndefined();
  });

  it('SE01 => undefined', () => {
    expect(getEpisodeDetails('SE01')).toBeUndefined();
  });
});

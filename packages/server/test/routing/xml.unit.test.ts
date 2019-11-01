import { getChildren, formatEpisode } from '../../src/routes';
import { createFolder, createFile } from '../../src/webdav';
import { films, shows } from './content';
import { extensions } from '../../src/content';

const testGetChildren = (path: string) => getChildren({ path, films, shows });
const createFolders = (folders: string[]) => folders.map((path) => createFolder({ path }));

const testFolders = (input: string, expected: string[]) => {
  it(`${input} => ${expected.join(', ')}`, () => {
    const output = testGetChildren(input);
    expect(output).toEqual(createFolders(expected));
  });
};

const pathShouldThrow = (path: string) => {
  it(`${path} => undefined`, () => {
    expect(testGetChildren(path)).toBeUndefined();
  });
};

describe('Paths should return the right children', () => {
  describe('Root path should return all resolutions', () => {
    testFolders('/', ['/best', '/2160', '/1080']);
  });

  describe('Resolution paths should return films and shows', () => {
    testFolders('/best', ['/best/films', '/best/shows']);
    testFolders('/2160', ['/2160/films', '/2160/shows']);
    testFolders('/1080', ['/1080/films', '/1080/shows']);
  });

  describe('Films: Paths should get the correct version of a film', () => {
    for (const [resolution, entries] of Object.entries(films)) {
      describe(resolution, () => {
        const filmPaths = Object.entries(entries).map(
          ([film, file]) => `${film}${extensions[file.mimeType]}`,
        );

        it(`/${resolution}/films => ${filmPaths.join(', ')}`, () => {
          const output = testGetChildren(`/${resolution}/films`);
          expect(output).toEqual(Object.entries(entries).map(
            ([film, file]) => createFile({
              ...file,
              path: `/${resolution}/films/${film}${extensions[file.mimeType]}`,
            }),
          ));
        });

        for (const [film, file] of Object.entries(entries)) {
          const path = `/${resolution}/films/${film}${extensions[file.mimeType]}`;

          it(`${path} => ${resolution} variant of ${film}`, () => {
            const output = testGetChildren(path);
            expect(output).toEqual([createFile({
              ...file,
              path,
            })]);
          });
        }
      });
    }
  });

  describe('Shows: Paths should get the correct episode', () => {
    for (const [resolution, entries] of Object.entries(shows)) {
      describe(resolution, () => {
        const showPaths = Object.keys(entries).map(
          (show) => `/${resolution}/shows/${show}`,
        );

        it(`/${resolution}/shows => ${showPaths.join(', ')}`, () => {
          const output = testGetChildren(`/${resolution}/shows`);
          expect(output).toEqual(showPaths.map(
            (path) => createFolder({ path }),
          ));
        });

        // test individual shows => seasons
        for (const [show, seasons] of Object.entries(entries)) {
          it(`/${resolution}/shows/${show} => season ${Object.keys(seasons).join(', ')}`, () => {
            const output = testGetChildren(`/${resolution}/shows/${show}`);
            expect(output).toEqual(Object.keys(seasons).map(
              (season) => createFolder({ path: `/${resolution}/shows/${show}/season ${season}` }),
            ));
          });

          // test individual seasons => episodes
          for (const [season, episodes] of Object.entries(seasons)) {
            it(`/${resolution}/shows/${show}/${season} => episode ${Object.keys(episodes).join(', ')}`, () => {
              const output = testGetChildren(`/${resolution}/shows/${show}/${season}`);
              expect(output).toEqual(Object.entries(episodes).map(
                ([episode, file]) => createFile({
                  mimeType: file.mimeType,
                  size: file.size,
                  path: `/${resolution}/shows/${show}/${season}/${show}-${formatEpisode(season, episode)}${extensions[file.mimeType]}`,
                }),
              ));
            });
          }
        }
      });
    }
  });

  describe('Paths that should throw', () => {
    pathShouldThrow('/720');
    pathShouldThrow('/best/shows/not-existing-show');
    pathShouldThrow('/best/shows/westworld/3');
  });
});

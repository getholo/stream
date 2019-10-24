import { Files, MapFile } from '../src/data';

// This input should not be changed...
// UNLESS all the tests depending on this input are updated.
const input: [string, MapFile][] = [
  ['1', {
    name: 'root',
    parent: null,
  }],
  ['1.1', {
    name: 'first',
    parent: '1',
  }],
  ['1.2', {
    name: 'another first',
    parent: '1',
  }],
  ['1.1.1', {
    name: 'second',
    parent: '1.1',
  }],
  ['1.1.2', {
    name: 'another second',
    parent: '1.1',
  }],
  ['1.1.1.1', {
    name: 'third',
    parent: '1.1.1',
  }],
];

describe('Data Structure', () => {
  describe('Deleting Items', () => {
    it('When deleting an item, all children should be deleted too', () => {
      const files = new Files(new Map(input));

      files.delete('1.1');

      const keys = Array.from(files.paths().keys());
      expect(keys).toEqual(['1', '1.2']);
    });
  });

  describe('Moving Items', () => {
    it('When moving an item, all children should reflect this change in their paths', () => {
      const files = new Files(new Map(input));

      // Make sure test conditions do not change
      const prePaths = files.paths();
      expect(prePaths.get('1.1.1')).toEqual('/first/second');
      expect(prePaths.get('1.1.1.1')).toEqual('/first/second/third');

      files.set('1.1.1', {
        name: 'second',
        parent: '1.2',
      });

      // Check whether the update is reflected in the paths
      const postPaths = files.paths();
      expect(postPaths.get('1.1.1')).toEqual('/another first/second');
      expect(postPaths.get('1.1.1.1')).toEqual('/another first/second/third');
    });
  });

  describe('Getting/Setting Items', () => {
    it('When setting an item on an empty map, we should be able to retrieve it', () => {
      const files = new Files();

      const file = {
        name: 'test',
        parent: null,
      };

      files.set('test', file);

      expect(files.get('test')).toEqual(file);
      expect(files.paths().size).toEqual(1);
    });

    it('When no root is set, paths should return undefined', () => {
      const files = new Files();

      files.set('2', {
        name: 'two',
        parent: '1',
      });
      files.set('3', {
        name: 'three',
        parent: '2',
      });

      expect(files.paths()).toBeUndefined();
    });

    it('When clearing files, size should be zero', () => {
      const files = new Files();

      files.set('2', {
        name: 'two',
        parent: '1',
      });
      files.set('3', {
        name: 'three',
        parent: '2',
      });

      expect(files.size).toEqual(2);
      files.clear();
      expect(files.size).toEqual(0);
    });
  });
});

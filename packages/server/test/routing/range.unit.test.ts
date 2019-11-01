import { parseRange, buffer } from '../../src/routes';

const testRange = (start = 0, end?: number) => {
  const size = 100 * 1024 * 1024;

  const header = (start || end) && `bytes=${start || ''}-${end || ''}`;
  it(`Header => ${header}`, () => {
    const range = parseRange(header, size);

    expect(range.start).toEqual(start);

    if (!end) {
      const expectedEnd = start + buffer;
      expect(range.end).toEqual(expectedEnd <= size ? expectedEnd : size);
    } else {
      expect(range.end).toEqual(end);
    }

    expect(range.contentLength).toEqual(size - start);
    expect(range.contentRange).toEqual(`bytes ${range.start}-${range.end}/${size}`);
  });
};

describe('Range Header Parsing', () => {
  testRange(undefined);
  testRange(1024);
  testRange(50 * 1024 * 1024);
  testRange(75 * 1024 * 1024);
  testRange(75 * 1024 * 1024, 80 * 1024 * 1024);
});

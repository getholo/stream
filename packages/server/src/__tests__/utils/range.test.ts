import { parseRange } from '~/utils/range';

const kb = 1024;
const mb = kb * 1024;
const gb = mb * 1024;

const buffer = 50 * mb;

describe('Parsing the Range Header', () => {
  it('When only given the start, the end should default to start + buffer', () => {
    // Arrange
    const start = 1200;
    const header = `bytes=${start}-`;
    const size = gb * 20;

    // Act
    const range = parseRange(header, size);

    // Assert
    expect(range.start).toEqual(start);
    expect(range.end).toEqual(start + buffer);
    expect(range.contentLength).toEqual(size - start);
    expect(range.contentRange).toEqual(`bytes=${start}-${range.end}/${size}`);
  });

  it('When given start and end, then end should equal the requested end', () => {
    // Arrange
    const start = 1200;
    const end = buffer * 2;
    const header = `bytes=${start}-${end}`;
    const size = buffer * 40;

    // Act
    const range = parseRange(header, size);

    // Assert
    expect(range.start).toEqual(start);
    expect(range.end).toEqual(end);
    expect(range.contentLength).toEqual(size - start);
    expect(range.contentRange).toEqual(`bytes=${start}-${end}/${size}`);
  });
});

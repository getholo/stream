const gigabyte = 1024 * 1024 * 1024;
const megabyte = 1024 * 1024;

export function parseRange(range: string, size: number) {
  const [rangeStart, rangeEnd] = range
    ? range.replace('bytes=', '').split('/')[0].split('-')
    : ['0', undefined];

  const requestedStart = rangeStart ? parseInt(rangeStart, 10) : 0;
  const requestedEnd = rangeEnd && parseInt(rangeEnd, 10);

  let buffer: number;
  if (size < 5 * gigabyte) {
    buffer = 15 * megabyte;
  } else if (size < 25 * gigabyte) {
    buffer = 50 * megabyte;
  } else {
    buffer = 100 * megabyte;
  }

  const startWithBuffer = requestedStart + buffer;

  const start = requestedStart;
  let end: number;

  if (requestedEnd) {
    end = requestedEnd;
  } else {
    end = startWithBuffer > size ? size : startWithBuffer;
  }

  const contentRange = `bytes=${start}-${end}/${size}`;
  const contentLength = size - requestedStart;

  return {
    contentRange,
    contentLength,
    start,
    end,
  };
}

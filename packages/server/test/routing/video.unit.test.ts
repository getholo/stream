import { getVideoStream } from '../../src/routes';
import { films, shows } from './content';
import { getAccessToken, getStream } from '../../src/google';

jest.mock('../../src/google');

const getToken = getAccessToken as jest.Mock;
const fetchStream = getStream as jest.Mock;

const testStream = (path: string, exists = true) => {
  it(`${path}`, async () => {
    getToken.mockReturnValueOnce('token');
    fetchStream.mockReturnValueOnce('test');

    const response = await getVideoStream({
      rangeHeader: 'bytes=0-',
      email: 'notmyemail',
      key: 'verysecret',
      films,
      shows,
      path,
    });

    if (exists) {
      expect(getToken).toHaveBeenCalledTimes(1);
      expect(fetchStream).toHaveBeenCalledTimes(1);

      expect(response.stream).toEqual('test');
      expect(response.headers).toEqual(expect.objectContaining({
        'Accept-Ranges': 'bytes',
        'Content-Type': expect.anything(),
        'Content-Length': expect.anything(),
        'Content-Range': expect.anything(),
      }));
    } else {
      expect(getToken).not.toHaveBeenCalled();
      expect(fetchStream).not.toHaveBeenCalled();
      expect(response).toBeUndefined();
    }
  });
};

describe('Paths should return video streams', () => {
  // reset `toHaveBeenCalledTimes` counter
  beforeEach(() => jest.resetAllMocks());

  testStream('/best/films/blade-runner.mkv', true);
  testStream('/best/shows/westworld/season 1/S01E01.mkv', true);
  testStream('/best/shows/westworld/season 1/S01E02.mkv', false);
  testStream('/best/shows/legion/season 1/S01E02.mkv', false);
  testStream('/best/shows/westworld', false);
  testStream('/best/films/toy-story.mkv', false);
});

import findMyWay from 'find-my-way';
import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Drive } from '@getholo/stream-core';
import { resolutions, RouteParams } from '~/types';
import Users from '~/auth/users';

import { films, shows } from './data';

jest.mock('@getholo/stream-core');

const mockedDrive = Drive as jest.Mock;
const onStreamHook = jest.fn;

mockedDrive.mockImplementation(
  () => ({
    films,
    shows,
    stream: async () => undefined,
  }),
);

const users = new Users();
users.upsert('test', 'test123');

export function createTestInstance(handler: (params: RouteParams) => any, withResolutions = true) {
  const router = findMyWay({
    ignoreTrailingSlash: true,
  });

  const drive = new Drive({
    credentials: undefined,
    driveId: undefined,
    files: undefined,
    patterns: undefined,
  });

  if (withResolutions) {
    for (const resolution of resolutions) {
      handler({
        drive,
        router,
        resolution,
        onStream: onStreamHook,
        users,
      });
    }
  } else {
    handler({
      drive,
      router,
      resolution: 'best',
      onStream: onStreamHook,
      users,
    });
  }

  return createServer((req: IncomingMessage, res: ServerResponse) => router.lookup(req, res));
}

import nanoid from 'nanoid';
import { IncomingMessage, ServerResponse } from 'http';
import Users from './users';

import { digest } from './digest';
import { basic } from './basic';

type Callback = (username: string) => any

const realm = 'beta@stream.getholo.dev';
const algorithm = 'MD5';
const qop = 'auth';

function notAuthenticated(res: ServerResponse) {
  const nonce = nanoid(24);
  res.setHeader('WWW-Authenticate', `Digest realm="${realm}",nonce="${nonce}",algorithm="${algorithm}",qop="${qop}"`);
  res.statusCode = 401;
  res.end();
}

export function withAuth(req: IncomingMessage, res: ServerResponse, users: Users, cb: Callback) {
  const header = req.headers.authorization;
  if (!header) {
    notAuthenticated(res);
    return;
  }

  const isDigest = header.startsWith('Digest');

  const username = isDigest
    ? digest({ header, users, method: req.method })
    : basic({ header, users });

  if (!username) {
    notAuthenticated(res);
    return;
  }

  cb(username);
}

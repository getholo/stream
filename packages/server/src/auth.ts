import { RouterContext } from '@koa/router';
import { createHash } from 'crypto';
import nanoid from 'nanoid';

type Next = () => Promise<any>

const md5 = (value: string) => createHash('md5').update(value).digest('hex');

interface Digest {
  username: string
  realm: string
  nonce: string
  response: string
  cnonce: string
  nc: string
  qop: string
  uri: string
}

export type AuthContext = RouterContext<{ user: string }>

export async function auth(ctx: AuthContext, next: Next) {
  const { request, response } = ctx;
  const header = request.get('authorization');

  const password = 'welcome to the alpha weekend';
  const realm = 'alpha-one@getholo.dev';

  if (!header) {
    response.set('WWW-Authenticate', `Digest realm="${realm}", nonce="${nanoid(24)}", algorithm="MD5"`);
    response.status = 401;
    return;
  }

  const isDigest = header.startsWith('Digest');
  const isBasic = header.startsWith('Basic');

  if (isDigest) {
    const creds = header.replace('Digest', '').split(',').reduce(
      (obj, cred) => {
        const [name, value] = cred.split('=');
        return {
          ...obj,
          [name.trim()]: value.replace(/"/g, '').trim(),
        };
      },
      {} as Digest,
    );

    const hash = md5(`${creds.username}:${realm}:${password}`);
    const hash2 = md5(`${request.method}:${creds.uri}`);

    const digesthash = creds.qop === 'auth'
      ? md5([hash, creds.nonce, creds.nc, creds.cnonce, creds.qop, hash2].join(':'))
      : md5([hash, creds.nonce, hash2].join(':'));

    if (creds.response === digesthash) {
      ctx.state.user = creds.username;
      await next();
      return;
    }
  }

  if (isBasic) {
    try {
      const creds = Buffer.from(header.replace('Basic', '').trim(), 'base64').toString('ascii');
      const [username, pass] = creds.split(':');

      if (pass === password) {
        ctx.state.user = username;
        await next();
        return;
      }
    } catch {
      // fall back to Digest auth
    }
  }

  response.set('WWW-Authenticate', `Digest realm="${realm}", nonce="${nanoid(24)}", algorithm="MD5"`);
  response.status = 401;
}

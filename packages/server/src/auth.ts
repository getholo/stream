import { ParameterizedContext } from 'koa';
import { createHash } from 'crypto';
import nanoid from 'nanoid';

type Next = () => Promise<any>

export const md5 = (value: string) => createHash('md5').update(value).digest('hex');

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

interface DigestAuthParams {
  header: string
  method: string
  realm: string
  password: string
}

export function digestAuth(params: DigestAuthParams) {
  const creds = params.header.replace('Digest', '').split(',').reduce(
    (obj, cred) => {
      const [name, value] = cred.split('=');
      return {
        ...obj,
        [name.trim()]: value.replace(/"/g, '').trim(),
      };
    },
    {} as Digest,
  );

  const hash1 = md5(`${creds.username}:${params.realm}:${params.password}`);
  const hash2 = md5(`${params.method}:${creds.uri}`);

  const digesthash = creds.qop === 'auth'
    ? md5([hash1, creds.nonce, creds.nc, creds.cnonce, creds.qop, hash2].join(':'))
    : md5([hash1, creds.nonce, hash2].join(':'));

  if (digesthash === creds.response) {
    return creds.username;
  }

  return undefined;
}

interface BasicAuthParams {
  header: string
  password: string
}

export function basicAuth(params: BasicAuthParams) {
  const creds = Buffer.from(params.header.replace('Basic', '').trim(), 'base64').toString('ascii');
  const [username, pass] = creds.split(':');

  if (pass === params.password) {
    return username;
  }

  return undefined;
}

export type AuthContext = ParameterizedContext<{ user: string }>

export const auth = (password: string, realm: string) => async (ctx: AuthContext, next: Next) => {
  const { request, response, method } = ctx;
  const header = request.get('authorization');

  if (!header) {
    response.set('WWW-Authenticate', `Digest realm="${realm}", nonce="${nanoid(24)}", algorithm="MD5"`);
    response.status = 401;
    return;
  }

  const isDigest = header.startsWith('Digest');
  const isBasic = header.startsWith('Basic');

  let username: string;

  if (isDigest) {
    try {
      username = digestAuth({
        header,
        method,
        password,
        realm,
      });
    } catch {
      // Incorrect header given, resolve to 401
    }
  }

  if (isBasic) {
    try {
      username = basicAuth({
        header,
        password,
      });
    } catch {
      // Set Header down below
    }
  }

  if (!username) {
    response.set('WWW-Authenticate', `Digest realm="${realm}", nonce="${nanoid(24)}", algorithm="MD5"`);
    response.status = 401;
  }

  ctx.state.user = username;
  await next();
};

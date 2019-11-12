import { createHash } from 'crypto';
import Users from './users';

const md5 = (value: string) => createHash('md5').update(value).digest('hex');

interface Credentials {
  realm: string
  username: string
  nonce: string
  uri: string
  cnonce: string
  nc: string
  qop: string
  response: string
  algorithm: string
}

interface Params {
  method: string
  header: string
  users: Users
}

export function digest(params: Params) {
  const { method, users } = params;
  const header = params.header.replace('Digest', '').trim();

  const credentials = header.split(',').reduce(
    (obj, cred) => {
      const [name, ...value] = cred.split('=');
      return {
        ...obj,
        [name.trim()]: value.join('=').replace(/"/g, '').trim(),
      };
    },
    {} as Credentials,
  );

  const {
    response,
    username,
    realm,
    uri,
    nonce,
    nc,
    cnonce,
    qop,
  } = credentials;

  if (!username) {
    return null;
  }

  const password = users.get(username);
  if (!password) {
    return null;
  }

  const hashOne = md5([username, realm, password].join(':'));
  const hashTwo = md5([method, uri].join(':'));

  const fullHash = md5([hashOne, nonce, nc, cnonce, qop, hashTwo].join(':'));
  if (fullHash === response) {
    return username;
  }

  return null;
}

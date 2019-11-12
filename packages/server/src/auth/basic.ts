import Users from './users';

interface Params {
  header: string
  users: Users
}

export function basic(params: Params) {
  const header = params.header.replace('Basic', '').trim();

  const [username, password] = Buffer.from(header, 'base64').toString('ascii').split(':');

  if (username && password && password === params.users.get(username)) {
    return username;
  }

  return null;
}

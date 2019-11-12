import mri, { Argv } from 'mri';
import createServer from '@getholo/stream-server';

import fs from 'fs';
import { promisify } from 'util';
import { version } from '../package.json';

const exists = promisify(fs.exists);
const read = promisify(fs.readFile);

interface Arguments extends Argv {
  account?: string
  drive?: string
  films?: string
  shows?: string
  version?: boolean
  user?: string | string[]
  password?: string | string[]
}

async function main() {
  const args: Arguments = mri(process.argv.slice(2), {
    alias: {
      v: 'version',
      u: 'user',
      p: 'password',
    },
    boolean: [
      'version',
    ],
  });

  if (args.version) {
    console.log(version);
    return;
  }

  const { drive } = args;

  if (!drive) {
    console.error('Please provide your Shared Drive ID with the `--drive` argument');
    return;
  }

  if (!args.account || !await exists(args.account)) {
    console.error('Please provide the path to the JSON key of your account with the `--account` argument');
    return;
  }

  const { client_email, private_key } = JSON.parse(await read(args.account, 'utf8'));
  if (!client_email || !private_key) {
    console.error('Incorrect JSON file');
    return;
  }

  if (!args.user || !args.password) {
    console.error('Please provide one user/password combo with -u <user> -p <password>');
    return;
  }

  const server = await createServer({
    credentials: {
      email: client_email,
      key: private_key,
    },
    driveId: drive,
    patterns: {
      film: args.films ?? '/films/:film/:file',
      show: args.shows ?? '/shows/:show/:season/:episode',
    },
  });

  console.log('Project Stream tuning in on port 4000!');

  const users: string[] = [];
  const passwords: string[] = [];

  if (typeof args.user === 'string') {
    users.push(args.user);
  } else {
    users.push(...args.user);
  }

  if (typeof args.password === 'string') {
    passwords.push(args.password);
  } else {
    passwords.push(...args.password);
  }

  users.forEach(
    (user, index) => {
      server.users.upsert(user, passwords[index]);
    },
  );
}

main();

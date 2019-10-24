import { createServer } from '@getholo/stream-server';
import mri, { Argv } from 'mri';
import fs from 'fs';
import { promisify } from 'util';

interface Arguments extends Argv {
  account?: string
  driveId?: string
  password?: string
}

interface Account {
  client_email: string
  private_key: string
}

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

async function main() {
  const args: Arguments = mri(process.argv.slice(2), {
    alias: {
      a: 'account',
      p: 'password',
    },
  });

  if (!args.account || !args.driveId) {
    console.log('Arguments missing! Please run this with --account <path> and --driveId <string>');
    return;
  }

  if (!await exists(args.account)) {
    console.log('Path does not exist!');
    return;
  }

  let account: Account;
  try {
    account = JSON.parse(await readFile(args.account, 'utf8'));
  } catch {
    console.log('Invalid JSON file!');
    return;
  }

  if (!account.client_email || !account.private_key) {
    console.log('Incomplete JSON file!');
    return;
  }

  const server = await createServer({
    driveId: args.driveId,
    email: account.client_email,
    key: account.private_key,
    password: args.password || 'alpha.2',
    realm: 'alpha.2@getholo.dev',
  });

  server.listen(4000, () => {
    console.log('Holo Stream tuning in on port 4000');
  });
}

main();

import { startServer } from '@getholo/stream-server';
import mri, { Argv } from 'mri';
import fs from 'fs';
import { promisify } from 'util';

interface Arguments extends Argv {
  account?: string
  driveId?: string
}

interface Account {
  client_email: string
  private_key: string
}

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

async function main() {
  const args: Arguments = mri(process.argv.slice(2));

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

  startServer(args.driveId, account.client_email, account.private_key);
}

main();

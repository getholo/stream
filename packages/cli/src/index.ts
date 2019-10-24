import { createServer, generateFilmExp, generateShowExp } from '@getholo/stream-server';
import mri, { Argv } from 'mri';
import fs from 'fs';
import { promisify } from 'util';
import kleur from 'kleur';

import { help } from './help';

const { version } = require('../package.json');

interface Arguments extends Argv {
  account?: string
  driveId?: string
  password?: string
  filmsPattern?: string
  showsPattern?: string
  version?: boolean
  help?: boolean
}

interface Account {
  client_email: string
  private_key: string
}

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

const argv = process.argv.slice(2);
process.title = 'Project Stream';

async function main() {
  const args: Arguments = mri(argv, {
    alias: {
      a: 'account',
      p: 'password',
      v: 'version',
      h: 'help',
    },
    boolean: [
      'version',
      'help',
    ],
  });

  if (args.version) {
    console.log(version);
    return;
  }

  if (args.help) {
    console.log(help);
    return;
  }

  if (!args.account || !args.driveId) {
    console.log(`${kleur.red('Error!')} Arguments missing!`);
    console.log(help);
    return;
  }

  if (!await exists(args.account)) {
    console.log(`${kleur.red('Error!')} Path does not exist!`);
    return;
  }

  let account: Account;
  try {
    account = JSON.parse(await readFile(args.account, 'utf8'));
  } catch {
    console.log(`${kleur.red('Error!')} Invalid JSON file!`);
    return;
  }

  if (!account.client_email || !account.private_key) {
    console.log(`${kleur.red('Error!')} Incomplete JSON file!`);
    return;
  }

  if (args.filmsPattern) {
    try {
      generateFilmExp(args.filmsPattern);
    } catch (somethingwentwrong) {
      const err: Error = somethingwentwrong;
      console.error(`${kleur.red('Error!')} Films pattern: ${err.message}`);
      return;
    }
  }

  if (args.showsPattern) {
    try {
      generateShowExp(args.showsPattern);
    } catch (somethingwentwrong) {
      const err: Error = somethingwentwrong;
      console.error(`${kleur.red('Error!')} Shows pattern: ${err.message}`);
      return;
    }
  }

  const server = await createServer({
    driveId: args.driveId,
    email: account.client_email,
    key: account.private_key,
    password: args.password || 'alpha.2',
    realm: 'alpha.2@getholo.dev',
    filmRegex: args.filmsPattern,
    showRegex: args.showsPattern,
  });

  server.listen(4000, () => {
    console.log('Holo Stream tuning in on port 4000');
  });
}

main();

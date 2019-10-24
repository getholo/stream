import kleur from 'kleur';

export const help = `
  ${kleur.bold('stream')} [options]

  ${kleur.dim('Required parameters:')}

    -a, --account   [path]    Path to the JSON file of your service account key
    --driveId       [id]      Identifier of the Shared Drive

  ${kleur.dim('Options:')}

    -h, --help                Display the help menu (this one)
    -p, --password  [pass]    Overwrite the default password
    --filmsPattern  [regex]   Custom pattern to match film files in Drive
    --showsPattern  [regex]   Custom pattern to match shows and episodes in Drive

  ${kleur.dim('Nerdy options:')}

    -d, --debug     [scope]   Debug in either "network" or "content" mode (Coming Soon)
    -v, --version             Display the current version of Project Stream
`;

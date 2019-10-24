<h1 align="center">Holo's Project Stream</h1>

<div align="center">
  A lightweight server for all your streaming needs
</div>

<br />

<div align="center">
  <a href="https://discord.gg/WMv7Spp">
    <img src="https://img.shields.io/discord/480480210643451904?label=discord" alt="Discord">
  </a>
  <a href="https://github.com/airbnb/javascript">
    <img src="https://img.shields.io/badge/code%20style-airbnb-ff69b4" alt="Code Style">
  </a>
</div>

<div align="center">
  <sub>
    Built with ❤️ by
    <a href="https://github.com/m-rots">Storm Timmermans</a>
  </sub>
</div>

## Features
- **efficient:** runs on servers with low specifications.
- **smart:** automatically parses your media to a compatible format.
- **client support:** supports multiple clients out of the box.

## How It Works
1. Project Stream scans your Google Drive through the use of a *service account* and a *shared drive*.
2. The server boots up and is now proxying all traffic from Google Drive to your clients through an accessible [WebDAV](http://www.webdav.org/specs/rfc4918.html) interface.

## Limitations
Project Stream is still considered to be in **alpha** stage. Many features are not yet implemented or might be unstable.
Currently known limitations:

- No support for TV Shows.
- Only 1080p and 2160p content is currently supported.
- No transcoded streams through the use of STRM.
- No multi-user support.
- No analytics platform.
- Only supports shared drives.

## Getting started

### Setting up the Google Cloud Project
1. Head over to the [Google Cloud Console](https://console.cloud.google.com) and create a new Project.
2. Enable the Drive API by visiting the APIs & Services tab, then selecting Library. In here you can search for `Google Drive`, to then enable this API.
3. With the API enabled, now visit the IAM & admin page, and select the Service Accounts tab.
Here you should create a new service account, take note of the email address, and download the key as a JSON file.

### Using an existing Shared Drive
*Note: there is no visual indicator indicating the progress of the fetching of files. Thus, it is recommended to use Shared Drives with less than 10.000 files for the best results.*

To use your existing media, in whatever format, it is crucial for you to tell Project Stream what your folder structure looks like.

#### Films Pattern
Default: `/films/:film/:file`

The films pattern requires two parameters: `film` and `file`. Parameters can be identified by the colon `:` in front of the name of the parameter.

1. `:film` is a folder with the title + of the film as its name.
2. `:file` is the actual file of the film. This should be either a `.mkv` or `.mp4` file and should include the resolution `2160p` or `1080p` in its name.
3. Additional parameters can be supplied to act as wildcards, but are currently ignored by the code.

Some of the most used patterns include:
- `/Media/Movies/:film/:file` (CloudBox default)
- `/Media/Movies/:resolution/:film/:file`
- `/Media/Movies/:decade/:film/:file`
- `/Movies/:resolution/:film/:file`
- `/Movies/:film/:file`

The films pattern can be set by supplying the CLI with the `--filmsPattern <pattern>` flag.

### Setting up a new Shared Drive

1. Create a new Shared Drive within your Google Drive. (Requires a [GSuite](https://gsuite.google.com/pricing.html) account)
2. Invite the email address of the service account you just made to the Shared Drive. (Read-Only access advised)
3. Create a new `films` folder at the root of your Shared Drive.
4. Within the `films` folder, you should add folders containing the name of the film + the year in any of these three formats:
    - my film (year)
    - my-film (year)
    - my-film-year
5. In these individual film folders you can copy any `.mkv` file which at least includes the resolution in its name:
    - 2160p.mkv
    - 1080p.mkv
    - my.film.year.1080p.mkv
    - my.film.year.2160p.mkv

The final file hierarchy should look like this:
```
Shared Drive
│
└───films
    │
    └───my film (year)
    │   │    my.film.year.1080p.mkv
    │   │    my.film.year.2160p.mkv
    │
    └───my-other-film-year
        │    1080p.mkv
```

### Installing Project Stream
1. Make sure you have [NodeJS](https://nodejs.org) installed with at least version 12 or higher.
2. Install Project Stream by running: `npm install -g @getholo/stream`.

### Running Project Stream
Run project stream with: `stream --account <account.json> --driveId <driveId> -p <password>`.

- In the placeholder of `<account.json>` you should fill in the path to the JSON file of the service account you just downloaded.
- In the placeholder of `<driveId>` you should fill in the ID of your Shared Drive.
You can find this ID at the end of the URL of your Shared Drive, ONLY when you're viewing it at the root level. (Should end with VA)
- In the placeholder of `<password>` you should fill in the password you want to use for authentication.
If the password is not given, it defaults to `alpha.2`.

You should now see the message: `Project Stream tuning in on port 4000`.
If this is **not** the case, something went wrong during the setup, and you should revisit the steps highlighted above.

## Client support
So far two clients have been tested with Project Stream: [Infuse](https://firecore.com/infuse) and [Kodi](https://kodi.tv).
Though in theory any client supporting the WebDAV standard should be compatible.

### Connecting to your Project Stream server with Kodi
1. Head over to settings (the cogwheel icon on your top left).
2. Click on the media tab.
3. Within Manage Sources, hit the `Videos...` button.
4. Select `Add videos...`
5. Within the pop-up window, click the `Browse` button.
6. Scroll down and click `Add network location...`

- **protocol:** WebDAV server (HTTP)
*Please select HTTPS when running this behind a reverse-proxy.*
- **Server address:** localhost
- **Remote path:** *you can leave this empty*
- **Port:** 4000
- **Username:** *can be anything really, just not blank*
- **Password:** `alpha.2` *or the password you set with the -p param*

7. Now select the share as `dav://localhost:4000`
8. Pick the resolution you would like to add
9. When in the films folder, click OK on the right
10. Click OK again
11. **This directory contains:** Movies
12. Click OK again
13. In the prompt, select `YES`

### Connecting to your Project Stream server with Infuse
*It is recommended to use a reverse proxy like [Caddy](https://caddyserver.com) to connect to Project Stream from other devices, such as your Apple TV, iPhone or iPad.*

1. Head over to settings.
2. Click the `Add Files` button.
3. Select `via Network Share`.

- **Name:** Project Stream
- **Protocol:** WebDAV *HTTPS when using Caddy*
- **Address:** Local IP of the machine running the Stream server, or subdomain when using Caddy.
- **Username:** *can be anything really, just not blank*
- **Password:** `alpha.2` *or the password you set with the -p param*

*Note: When not using Caddy, fill in port 4000 in the Advanced options*

4. Select the resolution you'd like to add, then click the little star icon.

## Reporting bugs
Please either leave an issue with somewhat detailed instructions on how to reproduce, how it occurred, etc.
Or just shoot a message on the Discord server!

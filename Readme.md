# Garmin-livetrack-obs
[![let's talk shop](https://img.shields.io/discord/314235571344244777.svg?color=%237289DA&label=Discord&logo=discord&logoColor=%23FFFFFF)](https://discord.gg/MMv23Fn)

Automatically search for the Garmin Livetrack email in your inbox and output fields from the API so they can be used in the OBS text source for livestreaming.

## Usage
1. Clone/[download](https://github.com/Novex/garmin-livetrack-obs/archive/master.zip) this repo
2. Copy the `config.template.js` file to `config.js` and fill in your email address and password
3. run `npm install` in a command prompt to get the dependencies
4. run `npm start` in a command prompt to start searching for a Garmin email

It will look for emails from the last 7 days and should update when new ones come in. You'll end up with a heap of text files in `outputFolder` (default `stats` in the current directory) that will be updated every `refreshTimeInMilliseconds` and can be loaded into an OBS text source.

Any problems, just pop into discord and let me know!
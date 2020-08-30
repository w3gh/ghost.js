# GHost.js
Ghost++ — is a Warcraft III game hosting bot. As the original project https://github.com/w3gh/ghostplusplus based on https://github.com/w3gh/ghost, 

This version is a try to port ghost++ to js

## Docker usage
Firstly you need download `docker` from https://www.docker.com/get-started
Then you need to build image with all `libbncsutil` and `libstorm` libraries
Also you can edit `config.json` to provide your own credentials for battle.net, currently only PvPGN is supported

```bash
cd path/to/ghost.js
docker build -t w3gh/ghost.js .
```
After, when image successfully builds, you need run it
```bash
docker run w3gh/ghost.js
```
And you will see log of running bot

## Usage

You need compiled `libbncsutil.dylib` or `libbncsutil.so` or `bncsutil.dll` in directory root.

And setup server credentials in `config.json`

```bash
git clone https://github.com/w3gh/ghost.js.git ghost
cd ghost
npm i
npm start
```

## Preview
it will display colored chat info like on screenshot below

[![asciicast](https://asciinema.org/a/75HoG34I0UEk9lNvDqeO430Cp.svg)](https://asciinema.org/a/75HoG34I0UEk9lNvDqeO430Cp)

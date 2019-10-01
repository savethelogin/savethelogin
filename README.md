# stl plugin

## Requirement

- Google Chrome
- npm (build only)
  - Linux: `sudo apt-get update && sudo apt-get install nodejs npm`
  - Mac: `brew install node`
  + Windows:
    - Download installer from http://www.nodejs.org/
    - <kbd>window</kbd> + <kbd>R</kbd> > cmd > npm


## Install without build

Download plugin from releases.

[Releases](https://gitlab.com/savethelogin/plugin/-/releases)


## Installation

1. Clone, build project.

```sh
git clone https://gitlab.com/savethelogin/plugin.git
cd plugin
npm install && npm run build
```

2. Open chrome, move to extensions page.

```
chrome://extensions
```

3. Enable Developer mode at top-right corner.

![Developer mode on](instruction-developer-mode.png)

4. Load dist extension directory.

```
plugin/dist
```

![Load unpacked](instruction-load-unpacked.png)



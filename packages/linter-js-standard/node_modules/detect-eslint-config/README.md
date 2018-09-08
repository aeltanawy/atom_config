# detect-eslint-config

detect if a file is in a project that has an eslint config

```sh
❯ npm i -D detect-eslint-config
```

use like:

```js
import detectEslintConfig from 'detect-eslint-config'

const hasEslintConfig = !!detectEslintConfig('dog/face')

if (hasEslintConfig) {
  console.log('we have found an eslint config for this project')
}
```

it is synchronous and it does not check any further back than a `package.json`
should it find one.

if it does not find one it will stop at the disk root.

it will not check for config at the root of the disk. i hope that is okay.

## developing

```sh
❯ git clone git@github.com:chee/detect-eslint-config
❯ cd detect-eslint-config
❯ # edit source/index.js
❯ npm run build # me up buttercup
❯ npm run test
❯ git add -A
❯ git commit -m 'heHELLP'
❯ git push -f
❯ git rm -r *
❯ git commit -m 'pleas'
❯ git push -f
❯ git filter-branch --tree-filter 'git rm -rf * || echo um'
❯ git push -f
```

and a splendid time was guaranteed for all

## TODO

* get some eggs at the shop before it closes

# linter-htmllint

A plugin for [Linter] providing an interface to [htmllint]. It will be
used with files that have the syntax.

## Installation

The [Linter] package will be installed for you to provide an interface to this package. If you are using an alternative debugging interface that supports linter plugins simply disable [Linter].

```ShellSession
$ apm install linter-htmllint
```

## Config

This plugin will search for a [htmllint] configuration file called `.htmllintrc` and use that file if it exists in any parent folder. It will stop at the first `.htmllintrc` file found.

## Settings

You can configure `linter-htmllint` in Atom's Settings.

[linter]: https://github.com/atom-community/linter "Linter"
[htmllint]: https://github.com/htmllint/htmllint "htmllint"

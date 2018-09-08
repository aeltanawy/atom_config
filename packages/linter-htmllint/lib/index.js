'use babel';

import { CompositeDisposable } from 'atom'; // eslint-disable-line import/extensions, import/no-extraneous-dependencies
import report from './report';

// Dependencies
let dirname;
let htmllint;
let findAsync;
let fsReadFile;
let generateRange;
let tinyPromisify;
let stripJSONComments;

// Configuration
let disableWhenNoHtmllintConfig;

// Internal variables
const phpEmbeddedScope = 'text.html.php';

// Internal functions
const getConfig = async (filePath) => {
  const readFile = tinyPromisify(fsReadFile);
  const configPath = await findAsync(dirname(filePath), '.htmllintrc');
  let conf = null;
  if (configPath !== null) {
    conf = await readFile(configPath, 'utf8');
  }
  if (conf) {
    return JSON.parse(stripJSONComments(conf));
  }
  return null;
};

const phpScopedEditor = editor => editor.getCursors().some(cursor =>
  cursor.getScopeDescriptor().getScopesArray().some(scope =>
    scope === phpEmbeddedScope));

const removePHP = str => str.replace(/<\?(?:php|=)?(?:[\s\S])+?\?>/gi, (match) => {
  const newlines = match.match(/\r?\n|\r/g);
  const newlineCount = newlines ? newlines.length : 0;

  return '\n'.repeat(newlineCount);
});

const loadDeps = () => {
  if (loadDeps.loaded) {
    return;
  }
  if (!dirname) {
    ({ dirname } = require('path'));
  }
  if (!htmllint) {
    htmllint = require('htmllint');
  }
  if (!findAsync || !generateRange) {
    ({ findAsync, generateRange } = require('atom-linter'));
  }
  if (!fsReadFile) {
    ({ readFile: fsReadFile } = require('fs'));
  }
  if (!tinyPromisify) {
    tinyPromisify = require('tiny-promisify');
  }
  if (!stripJSONComments) {
    stripJSONComments = require('strip-json-comments');
  }
  loadDeps.loaded = true;
};

export default {
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installLinterHtmllintDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-htmllint');
      }
      loadDeps();
    };
    depsCallbackID = window.requestIdleCallback(installLinterHtmllintDeps);
    this.idleCallbacks.add(depsCallbackID);

    this.grammarScopes = [];

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-htmllint.enabledScopes', (scopes) => {
      // Remove any old scopes
      this.grammarScopes.splice(0, this.grammarScopes.length);
      // Add the current scopes
      Array.prototype.push.apply(this.grammarScopes, scopes);
    }));
    this.subscriptions.add(atom.config.observe('linter-htmllint.disableWhenNoHtmllintConfig', (value) => {
      disableWhenNoHtmllintConfig = value;
    }));
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'htmllint',
      grammarScopes: this.grammarScopes,
      scope: 'file',
      lintOnFly: true,
      lint: async (editor) => {
        if (!atom.workspace.isTextEditor(editor)) {
          return null;
        }

        const filePath = editor.getPath();
        if (!filePath) {
          // Invalid path
          return null;
        }

        const isPhPEditor = phpScopedEditor(editor);

        const fileText = editor.getText();
        const text = isPhPEditor ? removePHP(fileText) : fileText;
        if (!text) {
          return [];
        }

        // Ensure that all dependencies are loaded
        loadDeps();

        const ruleset = await getConfig(filePath);
        if (!ruleset && disableWhenNoHtmllintConfig) {
          return null;
        }

        const issues = await htmllint(text, ruleset || undefined);

        if (editor.getText() !== fileText) {
          // Editor contents have changed, tell Linter not to update
          return null;
        }

        return issues.map((issue) => {
          try {
            return {
              range: generateRange(editor, issue.line - 1, issue.column - 1),
              type: 'error',
              text: htmllint.messages.renderIssue(issue),
              filePath
            };
          } catch (error) {
            report(issue, error);
            return null;
          }
        });
      }
    };
  }
};

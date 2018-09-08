var path = require('path')

var ref = require('fs');
var existsSync = ref.existsSync;
var statSync = ref.statSync;

var PACKAGE_JSON = 'package.json'

var ESLINT_FILES =
  '.eslintrc.js .eslintrc.json .eslintrc .eslintrc.yaml .eslintrc.yml'
    .split(' ')

var ESLINT_NODE = 'eslintConfig'

var isDirectory = function (file) { return statSync(file).isDirectory(); }
var isRoot = function (directory) { return directory === path.resolve(directory, '..'); }
var createResolver = function (directory) { return function (file) { return path.resolve(directory, file); }; }
var dirname = path.dirname;

module.exports = function detectEslintConfig (file) {
  var directory = isDirectory(file) ? file : dirname(file)

  var resolve = createResolver(directory)

  if (isRoot(directory)) { return false }

  var packageJson = resolve(PACKAGE_JSON)

  var detectedFile = ESLINT_FILES.find(function (eslintFile) { return existsSync(resolve(eslintFile)); }
  )

  if (existsSync(packageJson)) {
    return (detectedFile && resolve(detectedFile)) ||
      (require(packageJson)[ESLINT_NODE] && packageJson)
  }

  return (detectedFile && resolve(detectedFile)) ||
    detectEslintConfig(resolve('..'))
}

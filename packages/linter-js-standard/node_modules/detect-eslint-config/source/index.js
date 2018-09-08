const path = require('path')

const {existsSync, statSync} = require('fs')

const PACKAGE_JSON = 'package.json'

const ESLINT_FILES =
  '.eslintrc.js .eslintrc.json .eslintrc .eslintrc.yaml .eslintrc.yml'
    .split(' ')

const ESLINT_NODE = 'eslintConfig'

const isDirectory = file => statSync(file).isDirectory()
const isRoot = directory => directory === path.resolve(directory, '..')
const createResolver = directory => file => path.resolve(directory, file)
const {dirname} = path

module.exports = function detectEslintConfig (file) {
  const directory = isDirectory(file) ? file : dirname(file)

  const resolve = createResolver(directory)

  if (isRoot(directory)) return null

  const packageJson = resolve(PACKAGE_JSON)

  const detectedFile = ESLINT_FILES.find(eslintFile =>
    existsSync(resolve(eslintFile))
  )

  if (existsSync(packageJson)) {
    return (detectedFile && resolve(detectedFile)) ||
      (require(packageJson)[ESLINT_NODE] && packageJson)
  }

  return (detectedFile && resolve(detectedFile)) ||
    detectEslintConfig(resolve('..'))
}

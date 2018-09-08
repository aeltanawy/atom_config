const it = require('tape')
const detectConfig = require('../dist')

it('correctly detects eslint config in a package.json', tape => {
  const hasConfig = detectConfig(`${__dirname}/packagejson/beak.js`)
  tape.plan(1)
  tape.equal(!!hasConfig, true)
  tape.end()
})

it('correctly detects eslint config in a project root', tape => {
  const hasConfig = detectConfig(`${__dirname}/root/index.js`)
  tape.plan(1)
  tape.equal(!!hasConfig, true)
  tape.end()
})

it('correctly detects eslint config in a subdirectory', tape => {
  const hasConfig =
    detectConfig(`${__dirname}/subdirectory/help-me/charlie/index.js`)
  tape.plan(1)
  tape.equal(!!hasConfig, true)
  tape.end()
})

it('returns false if no eslint config is detected', tape => {
  const hasConfig = detectConfig(`${__dirname}/none/pineapples.js`)
  tape.plan(1)
  tape.equal(!!hasConfig, false)
  tape.end()
})

it('works if you specify a directory', tape => {
  const hasConfig = detectConfig(`${__dirname}/root/`)
  tape.plan(1)
  tape.equal(!!hasConfig, true)
  tape.end()
})

it('returns the path to the file', tape => {
  const hasConfig = detectConfig(`${__dirname}/root/index.js`)
  tape.plan(1)
  tape.equal(hasConfig.endsWith('root/.eslintrc.json'), true)
  tape.end()
})

it('returns the path to the package.json', tape => {
  const hasConfig = detectConfig(`${__dirname}/packagejson/beak.js`)
  tape.plan(1)
  tape.equal(hasConfig.endsWith('packagejson/package.json'), true)
  tape.end()
})

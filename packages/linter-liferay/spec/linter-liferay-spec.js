'use babel'

import path from 'path'
import {BufferedProcess} from 'atom'

import LinterLiferay from '../lib/linter-liferay'

const TEST_FILE_PATH = path.join(__dirname, 'fixtures', 'test.js')
const TEST_FILE_PATH_WITH_CONFIG = path.join(__dirname, 'fixtures', 'with-config', 'test.js')

describe('linter-liferay', () => {
  let linterLiferay

  beforeEach(() => {
    linterLiferay = new LinterLiferay()

    waitsForPromise(() => atom.packages.activatePackage('linter-liferay'))
  })

  afterEach(() => {
    linterLiferay.destroy()
  })

  describe('provideLinter', () => {
    it('should return a linter object', () => {
      const linter = linterLiferay.provideLinter();

      ['grammarScopes', 'lint', 'lintsOnChange', 'name', 'scope'].forEach(
        attr => expect(linter[attr]).toBeDefined()
      )
    })
  })

  describe('_createProcess', () => {
    it('should return a new BufferedProcess', done => {
      const process = linterLiferay._createProcess(TEST_FILE_PATH, () => {})

      expect(process).toBeInstanceOf(BufferedProcess)
    })

    it('should call the callback with the output', () => {
      let value, flag

      runs(() => {
        const process = linterLiferay._createProcess(TEST_FILE_PATH, output => {
          flag = true
          value = output
        })
      })

      waitsFor(() => flag, 'reachedTimeout', 15000)

      runs(() => {
        expect(value).toBeInstanceOf(Array)
      })
    })
  })

  describe('_formatArgs', () => {
    it('should return an array of args', () => {
      expect(linterLiferay._formatArgs()).toContain('--no-color')
    })
  })

  describe('_lint', () => {
    it('should return a promise with the lint result', () => {
      waitsForPromise(() =>
        atom.workspace.open(TEST_FILE_PATH).then(
          editor => linterLiferay._lint(editor)
        ).then(
          result => expect(result).toBeDefined()
        )
      )
    })

    it('should return undefined if requireConfig is true and no config is found', () => {
      linterLiferay._requireConfig = true
      waitsForPromise(() =>
        atom.workspace.open(TEST_FILE_PATH).then(
          editor => linterLiferay._lint(editor)
        ).then(
          result => expect(result).toBeUndefined()
        )
      )
    })

    it('should return a promise if requireConfig is true and config is found', () => {
      linterLiferay._requireConfig = true
      waitsForPromise(() =>
        atom.workspace.open(TEST_FILE_PATH_WITH_CONFIG).then(
          editor => linterLiferay._lint(editor)
        ).then(
          result => expect(result).toBeDefined()
        )
      )
    })
  })

  describe('_getMatch', () => {
    it('returns a match object', () => {
      expect(typeof linterLiferay._getMatch([])).toBe('object')
    })
  })

  describe('_getMessages', () => {
    it('should return an array of messages', () => {
      const errors = [
        'Line 1, Column 7: \'myObject\' is defined but never used',
        'Line 2, Column 3: Expected indentation of 1 tab character but found 0.'
      ]

      waitsForPromise(() =>
        atom.workspace.open(TEST_FILE_PATH).then(
          editor => {
            const messages = linterLiferay._getMessages(editor, errors)

            expect(messages.length).toBe(2)

            const message = messages[0]

            expect(message.excerpt).toMatch('defined but never')
            expect(message.location.file).toBe(TEST_FILE_PATH)
            expect(message.location.position).toBeInstanceOf(Array)
            expect(message.severity).toBe('warning')
          }
        )
      )
    })
  })

  describe('_getRange', () => {
    it('should return a 2d array representing a range', () => {
      waitsForPromise(() =>
        atom.workspace.open(TEST_FILE_PATH).then(
          editor => {
            const range = linterLiferay._getRange(editor, {
              column: 5,
              lineEnd: 5,
              lineStart: 5,
              message: 'test'
            })

            expect(range[0][0]).toBeDefined()
            expect(range[1][0]).toBeDefined()
          }
        )
      )
    })
  })
})

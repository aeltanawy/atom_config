'use babel'

const PKG_NAME = 'linter-liferay'

describe('plugin', () => {
  beforeEach(() => {
    expect(atom.packages.isPackageActive(PKG_NAME)).toBe(false)

    waitsForPromise(() => atom.packages.activatePackage(PKG_NAME))
  })

  afterEach(() => {
    atom.packages.deactivatePackage(PKG_NAME)
  })

  it('should activate', () => {
    expect(atom.packages.isPackageLoaded(PKG_NAME)).toBe(true)
    expect(atom.packages.isPackageActive(PKG_NAME)).toBe(true)
  })

  it('should provide a linter', () => {
    const linter = atom.packages.getActivePackage(PKG_NAME).mainModule.provideLinter()

    expect(typeof linter.lint).toBe('function')
  })
})

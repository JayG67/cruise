const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '../..')

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function getDelegatedControllerNames(controllerSource) {
  const facadeMatch = controllerSource.match(/Object\.assign\(\s*exports\s*,([\s\S]*?)\)\s*$/m)

  if (!facadeMatch) {
    throw new Error('Expected the legacy controller to expose a terminal Object.assign(exports, ...) facade')
  }

  return facadeMatch[1]
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
}

function getDefaultControllerModulePath(controllerName) {
  if (!controllerName || !controllerName.endsWith('Controller')) {
    throw new Error('Controller facade names must end with Controller')
  }

  return `./${controllerName.slice(0, -'Controller'.length)}.controller`
}

function expectControllerDelegated(controllerSource, controllerName, modulePath = getDefaultControllerModulePath(controllerName)) {
  expect(controllerSource).toContain(`const ${controllerName} = require('${modulePath}')`)
  expect(getDelegatedControllerNames(controllerSource)).toContain(controllerName)
}

module.exports = {
  expectControllerDelegated,
  getDefaultControllerModulePath,
  getDelegatedControllerNames,
  readProjectFile
}

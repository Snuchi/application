// Загрузка нативного модуля ввода. Если не собран/не Windows — null.
let addon = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  addon = require('./build/Release/avn_input.node')
} catch {
  addon = null
}

module.exports = addon

'use strict'

require('./test/server.bootstrap')

var normaliseOptions = require('./js/normaliseOptions')
var gitDiffFake = require('./js/gitDiffFake')
var gitDiffReal = require('./js/gitDiffReal')
var validate = require('./js/validate')

var gitDiffSync = function(str1, str2, options) {



  validate(str1, str2)
  options = normaliseOptions(options)

  if (str1 === str2) return undefined

  if (options.forceFake) {
    return gitDiffFake(str1, str2, options)
  } else {
    return gitDiffReal(str1, str2, options) || gitDiffFake(str1, str2, options)
  }
}

module.exports = gitDiffSync

'use strict'

var exec = require('shelljs.exec')
var logger = require('loglevel')
var SHA_REGEX = /^[0-9a-fA-F]{5,}$/

logger.setLevel('info')

// Returns the same as:
// git diff $(printf 'my first string' | git hash-object -w --stdin) $(printf 'my second string' | git hash-object -w --stdin) --word-diff
// git diff $(printf 'This is a test for my diff tool\nIt is a big test\n\nNo diff here\n\nBut there might be here\nBut not here\n\nOr here\n' | git hash-object -w --stdin) $(printf 'This is a test for my difference tool\nIt is a small test\n\nNo diff here\n\nBut there might be here!\nBut not here\n\nOr here\n' | git hash-object -w --stdin) --word-diff

function generateDiff(str1, str2, options, gitDir) {

  if (typeof gitDir === 'string') {
    gitDir = '--git-dir ' + gitDir
  } else {
    gitDir = ''
  }

  var DEFAULTS = require('../_shared/defaultOptions')

  var stringify1 = JSON.stringify(str1).replace(/^"/, '').replace(/"$/, '')
  var stringify2 = JSON.stringify(str2).replace(/^"/, '').replace(/"$/, '')

  // Single quotes is needed here to avoid .. event not found
  var gitHashCmd1 = 'printf \'' + stringify1 + '\' | git ' + gitDir + ' hash-object -w --stdin'
  var gitHashCmd2 = 'printf \'' + stringify2 + '\' | git ' + gitDir + ' hash-object -w --stdin'

  var gitHashObj1 = exec(gitHashCmd1, {silent: true})
  var gitHashObj2 = exec(gitHashCmd2, {silent: true})

  /* istanbul ignore else */
  if (gitHashObj1.code === 0 && gitHashObj2.code === 0) {

    var sha1 = gitHashObj1.stdout.replace(CR, '')
    var sha2 = gitHashObj2.stdout.replace(CR, '')

    var sha1Test = SHA_REGEX.test(sha1)
    var sha2Test = SHA_REGEX.test(sha2)

    /* istanbul ignore else */
    if (sha1Test && sha2Test) {

      var trueDiffObj, repeat

      do {

        var flags = ''

        if (options.wordDiff) {
          flags += ' --word-diff'
        }

        if (options.color) {
          flags += ' --color=always'
        }

        if (options.flags) {
          flags += ' ' + options.flags
        }

        var newCommand = 'git ' + gitDir + ' diff ' + sha1 + ' ' + sha2 + flags

        trueDiffObj = exec(newCommand, {silent: true})

        if (trueDiffObj.code === 129 && trueDiffObj.stderr.indexOf('usage') > -1) {
          logger.warn('Ignoring invalid git diff options: ' + options.flags)
          logger.info('For valid git diff options refer to https://git-scm.com/docs/git-diff#_options')
          if (options.flags === DEFAULTS.flags) {
            DEFAULTS.flags = null
          }
          options.flags = DEFAULTS.flags
          if (options.flags) {
            logger.info('Using default git diff options: ' + options.flags)
          }
          repeat = true
        } else {
          repeat = false
        }
      } while (repeat)

      /* istanbul ignore else */
      if (trueDiffObj.code === 0) {

        var trueDiff = trueDiffObj.stdout

        trueDiff = trueDiff.substring(trueDiff.indexOf('@@'))

        return (trueDiff !== '') ? trueDiff : undefined
      }
    }
  }
  /* istanbul ignore next */
  return undefined
}

module.exports = generateDiff


var fs = require('fs');
var spawn = require('child_process').spawn;
var sh = require('shelljs');

var exists = fs.existsSync;
var path = require('path');
var join = path.join;
var rl = require('readline');
var utils = require('../lib/utils');
var fatal = utils.fatal;
var error = utils.error;
var log = utils.log;
var warn = utils.warn;

var home = exports.home = process.env['HOME'];
var version = exports.version = require('../package.json').version;
var repoPath = exports.repoPath = path.join(home, '.dotfiles');

function batch (commands, done) {
  if(!Array.isArray(commands) || commands.length < 1) {
    process.exit();
  }
  var tmpFile =  '/tmp/dfm_batch_commands_' + Date.now();
  commands.push('rm -f ' + tmpFile);
  fs.writeFileSync(tmpFile, commands.join('\n'), 'utf8');
  var child = spawn('/bin/bash', [tmpFile], {
    stdio: 'inherit'
  });

  child
    .on('exit', function() {
      if (done && typeof done === 'function') {
        done();
      } else {
        process.exit();
      }
    })
    .on('error', function(err) {
      error(err);
      process.exit();
    });
};
exports.batch = batch;

function confirmExec(commands, done) {
  console.log('Commands:');
  console.log(commands.join('\n'));
  rl.createInterface({
    input: process.stdin,
    output: process.stdout
  }).question('Execute above commands? [yes/no] ', function(ans) {
    if (ans === 'yes') {
      batch(commands, done);
    } else {
      console.log('Abort.');
      if (done && typeof done === 'function') {
        done();
      } else {
        process.exit();
      }
    }
  });
}
exports.confirmExec = confirmExec;

function isSubDirOf(a, b) {
  return !(path.relative(b, a).slice(0, 2) === '..');
};
exports.isSubDirOf = isSubDirOf;

function isDir(p) {
  return fs.statSync(p).isDirectory();  
};
exports.isDir = isDir;

function findDotFileInRepo(file) {
  var relPath = path.relative(home, path.resolve(file));
  return path.resolve(repoPath, relPath);
};
exports.findDotFileInRepo = findDotFileInRepo;

exports.getDotFileList = function() {
  sh.cd(repoPath);
  return sh.exec('git ls-files', {silent: true}).output.trim().split('\n');
};

if (require.main === module) {
  batch([
    'cd ' + home,
    'ls'
  ]);
  console.log('home: ', home);
  console.log('.ssh/config: ', findDotFileInRepo('./.ssh/config'));
}
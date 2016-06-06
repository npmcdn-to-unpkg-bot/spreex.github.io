var gulp = require('gulp');
var Server = require('karma').Server;
var bower = require('gulp-bower');
var runSequence = require('run-sequence');
var del = require('del');
var less = require('gulp-less');
var concat = require('gulp-concat');
var fs = require('fs');
var uglify = require('gulp-uglifyjs');

gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true,
  }, done).start();
});


gulp.task('bower', function() {
  return bower();
});


gulp.task('jquery', function() {
  git.updateSubmodule({ args: '--init' }, function() {
    process.chdir('./jquery');
    console.log('npm install');
    var npm = require('child_process').spawn('npm', ['install'], {stdio: 'inherit', shell: true});
    npm.on('exit', function(code) {
      console.log('grunt');
      var grunt = require('child_process').spawn('grunt', ['custom:-deprecated,' +
                                  '-ajax/jsonp,-exports/amd,-sizzle,' +
                                  '-event/focusin'], {stdio: 'inherit', shell: true});
    });
  });
});

//
// Bootstrap
//

gulp.task('vendor:bootstrap:js', function() {
  return gulp.src(
    ['bower_components/bootstrap-sass/assets/javascripts/bootstrap.min.js',
    'bower_components/bootstrap-sass/assets/javascripts/bootstrap.js']
  ).pipe(gulp.dest('vendor/bootstrap'));
});

gulp.task('vendor:bootstrap:css', function() {
  return gulp.src(
    'bower_components/bootstrap-sass/assets/stylesheets/**/*'
  ).pipe(gulp.dest('vendor/bootstrap/stylesheets'));
});

gulp.task('vendor:bootstrap', ['vendor:bootstrap:js', 'vendor:bootstrap:css']);

//
// Font Awesome
//

gulp.task('vendor:fa:css', function () {
  return gulp.src('bower_components/font-awesome/css/*').pipe(gulp.dest('vendor/fontawesome/css'));
});
gulp.task('vendor:fa:fonts', function () {
  return gulp.src('bower_components/font-awesome/fonts/*').pipe(gulp.dest('vendor/fontawesome/fonts'));
});
gulp.task('vendor:fa', ['vendor:fa:fonts', 'vendor:fa:css']);

//
// jQuery
//

gulp.task('vendor:jquery', function () {
  return gulp.src('bower_components/jquery/dist/*').pipe(gulp.dest('vendor/jquery'));
});

//
// Socket.io client
//

gulp.task('vendor:sio', function () {
  return gulp.src('bower_components/socket.io-client/socket.io.js').pipe(gulp.dest('vendor'));
});


gulp.task('vendor:clean', function() {
  return del(['vendor/**/*']);
});

gulp.task('jekyll:build', function (done){
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit', shell: true});
  jekyll.on('exit', function(code) {
    done(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
  });
});

gulp.task('jekyll:clean', function() {
  return del(['_site']);
});

gulp.task('jekyll:serve', function (done){
  var spawn = require('child_process').spawn;
  var jekyll = spawn('jekyll', ['serve', '--incremental', '--watch'], {stdio: 'inherit', shell: true});
  jekyll.on('exit', function(code) {
    done(code === 0 ? null : 'ERROR: Jekyll process exited with code: ' + code);
  });
});

gulp.task('default', function() {
  runSequence(
    'bower',
    'vendor:clean',
    [
      'vendor:jquery',
      'vendor:bootstrap',
      'vendor:fa',
      'vendor:sio'
    ],
    'jekyll:clean',
    'jekyll:build');
});

gulp.task('serve', function() {
  runSequence(
    'bower',
    'vendor:clean',
    [
      'vendor:jquery',
      'vendor:bootstrap',
      'vendor:fa',
      'vendor:sio'
    ],
    'jekyll:clean',
    'jekyll:serve');
});

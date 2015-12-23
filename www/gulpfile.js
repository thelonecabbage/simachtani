var gulp = require('gulp');
var fs = require('fs');
var cheerio = require('cheerio');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
// var gulpif = require('gulp-if');

var release = false;

var source_scripts = [
  './bower_components/angular/angular.js',
  './bower_components/ui-router/release/angular-ui-router.js',
  './bower_components/angular-aria/angular-aria.js',
  './bower_components/angular-animate/angular-animate.js',
  './bower_components/angular-material/angular-material.js',
  './bower_components/lodash/lodash.js',
  './bower_components/restangular/dist/restangular.js',
  './js/app.js',
  './js/router.js',
  './js/filters.js',
  './modules/text-display/controller.js'
];

gulp.task('default', ['style', 'scripts']);

gulp.task('style', function () {
  gulp.src('./sass/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.init())
    .pipe(concat('all.css'))
    .pipe(minifyCss({
      compatibility: 'ie8'
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'));
})

gulp.task('scripts', function () {
  //return gulp.src(collectScripts('index.html'))
  return gulp.src(source_scripts)
    .pipe(sourcemaps.init())
    .pipe(concat('all.js'))
    .pipe(uglify({
      mangle: false,
      compress: {
        negate_iife: false
      },
      //output: {
      //  source_map: true
      // }
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function () {
  gulp.watch('./sass/**/*.scss', ['style']);
  gulp.watch(collectScripts('index.html'), ['scripts']);
});

/// ---- LIB functions

function collectScripts(fromFile) {
  var fileName = fromFile.split('.html')[0] + '.html'; // allow for entering fileName with or without html extension
  //noinspection JSUnresolvedFunction
  var $file = cheerio.load(fs.readFileSync(fileName).toString());
  var allScripts = $file('script');
  var internalScripts = [];
  var i;

  for (i = 0; i < allScripts.length; i++) {
    internalScripts.push('.' + allScripts[i].attribs.src)
  }
  console.log(internalScripts);
  return internalScripts
}
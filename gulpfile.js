const autoprefixer = require('autoprefixer');
const browserify = require('browserify');
const browsersync = require('browser-sync').create();
const buffer = require('vinyl-buffer');
const cssnano = require('cssnano');
const del = require('del');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const ssi = require('gulp-ssi');
const tsify = require('tsify');
const uglify = require('gulp-uglify-es').default;
const util = require('gulp-util');

var production = false;

function clean() {
  return del(['./build/*']);
}

function scss() {
  return gulp
    .src('./src/scss/*.scss')
    .pipe(production ? util.noop() : sourcemaps.init())
    .pipe(plumber({ errorHandler: function(err) {
      console.error('[ Error in `gulp-sass` ]');
      console.log(err.messageFormatted);
      this.emit('end');
    }}))
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(production ? util.noop() : sourcemaps.write())
    .pipe(gulp.dest('./build/css/'))
    .pipe(browsersync.stream());
}

function typescript(cb) {
  return browserify({
      debug: !production,
      entries: ['./src/ts/app.ts']
    })
    .plugin(tsify, { target: 'es6' })
    .bundle()
    .on('error', function(err) {
      console.error('[ Error in `browserify` ]');
      console.log(err.message);
      this.emit('end');
    })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(production ? util.noop() : sourcemaps.init({ loadMaps: true }))
    .pipe(gulp.dest('./build/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(production ? util.noop() : sourcemaps.write())
    .pipe(gulp.dest('./build/js'))
    .pipe(browsersync.stream());
}

function assets() {
  return gulp
    .src('./src/assets/**/*')
    .pipe(gulp.dest('./build/assets/'))
    .pipe(browsersync.stream());
}

function fonts() {
  return gulp
    .src('./src/fonts/**/*')
    .pipe(gulp.dest('./build/fonts/'))
    .pipe(browsersync.stream());
}

function js() {
  return gulp
    .src('./src/js/**/*')
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./build/js/'))
    .pipe(browsersync.stream());
}

function html() {
  return gulp
    .src('./src/html/*.html')
    .pipe(ssi())
    .pipe(gulp.dest('./build'));
}

function watchFiles() {
  gulp.watch('./src/scss/**/*.scss', scss);
  gulp.watch('./src/ts/**/*.ts', typescript);
  gulp.watch('./src/js/**/*.js', js);
  gulp.watch('./src/assets/**/*', assets);
  gulp.watch('./src/fonts/**/*', assets);
  gulp.watch('./src/html/**/*.html', gulp.series(html, browserSyncReload));
}

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./build/"
    },
    open: false,
    port: 3000
  });
  done();
}
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

function prodMode(done) {
  production = true;
  done();
}

const build = gulp.series(clean, gulp.parallel(scss, typescript, js, assets, fonts, html));
const prodBuild = gulp.series(prodMode, build);
const dev = gulp.series(build, gulp.parallel(watchFiles, browserSync));

exports.build = prodBuild;
exports.dev = dev;
exports.default = prodBuild;
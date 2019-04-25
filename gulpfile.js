/**
 * Init Gulp plugins
 */

const gulp = require("gulp"),
  scss = require("gulp-sass"),
  sourcemaps = require("gulp-sourcemaps"),
  autoprefixer = require("gulp-autoprefixer"),
  cleanCSS = require('gulp-clean-css'),
  uglify = require("gulp-uglify"),
  imagemin = require("gulp-imagemin"),
  rename = require("gulp-rename"),
  concat = require("gulp-concat"),
  cache = require("gulp-cache"),
  plumber = require("gulp-plumber"),
  del = require("del"),
  path = require("path"),
  eslint = require("gulp-eslint"),
  stylelint = require("gulp-stylelint"),
  browserSync = require("browser-sync").create();

  const { watch, series, parallel } = require('gulp');
  
/**
 * Plumber options
 * @type {{errorHandler: errorAlert}}
 */
const plumberOptions = {
  errorHandler: errorAlert
};

/**
 * What browsers we want to support
 * @type {{browsers: string[], cascade: boolean}}
 */
const autoPrefixerOptions = {
  browsers: [
    "> 1%",
    "last 2 versions",
    "firefox >= 4",
    "safari 7",
    "safari 8",
    "IE 9",
    "IE 10",
    "IE 11"
  ],
  cascade: false
};

/**
 * Define the SCSS files to compile
 * @type {string[]}
 */
const stylesheets = [
  './css/app.scss' // other stylesheets imported into this one
];

/**
 * Declare all the JavaScript for the development and production builds
 * @type {string[]}
 */
const javascript = [
  './js/vendor/**/*.js',
  './js/app.js'
];

/**
 * Let's keep our asset folders clean and tidy - clean assets
 */
function clean(cb) {
  return del(["assets/*"]);
}

/**
 * Clear cache plugin
 */
function cleanCache(cb) {
  if (process.env.NODE_ENV === 'production' || process.env.CACHE_ENV === 'clear') { // only clear cache when running the release build (setting node env)
    return cache.clearAll()
  }
  else { // else, ignore
    cb()
  }
}

/**
 * Build stylesheets
 */
// Development CSS
function devStyles() {
  return gulp
  .src(stylesheets)
  .pipe(plumber(plumberOptions))
  .pipe(sourcemaps.init())
  .pipe(scss({
      paths: [path.join(__dirname, 'scss', 'includes')]
  }))
  .pipe(autoprefixer(autoPrefixerOptions))
  .pipe(cleanCSS({compatibility: 'ie9', debug: true}))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./assets/css/'))
  .pipe(browserSync.reload({stream: true}))
  .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Development styles built!'); })
}
// Production CSS
function prodStyles() {
  return gulp
  .src(stylesheets)
  .pipe(plumber(plumberOptions))
  .pipe(scss({
      paths: [path.join(__dirname, 'scss', 'includes')]
  }))
  .pipe(autoprefixer(autoPrefixerOptions))
  .pipe(cleanCSS({compatibility: 'ie9', debug: true}, (details) => {
      console.log('\x1b[35m%s\x1b[0m', `Size of original ${details.name} file = ${details.stats.originalSize}`);
      console.log('\x1b[35m%s\x1b[0m', `Size of compressed ${details.name} file = ${details.stats.minifiedSize}`);
  }))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('./assets/css/'))
  .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Production styles built!'); })
}

/**
 * Build scripts
 */
// Development JS
function devScripts() {
  return gulp
  .src(javascript)
  .pipe(plumber(plumberOptions))
  .pipe(sourcemaps.init())
  .pipe(concat({path: 'app.js', stat: {mode: 0777}}))
  .pipe(uglify({warnings: 'verbose'}))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./assets/js'))
  .pipe(browserSync.reload({stream: true}))
  .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Development scripts built!'); })
}
// Production JS
function prodScripts() {
  return gulp
  .src(javascript)
  .pipe(plumber(plumberOptions))
  .pipe(concat({path: 'app.js', stat: {mode: 0777}}))
  .pipe(uglify({warnings: 'verbose'}))
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('./assets/js'))
  .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Production scripts built!'); })
}

/**
 * Image optimisation
 */
function images() {
  return gulp
  .src('./img/**/*')
  .pipe(plumber(plumberOptions))
  .pipe(cache(imagemin({optimizationLevel: 3, progressive: true, interlaced: true, verbose: true})))
  .pipe(gulp.dest('./assets/img'))
  .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'Images compressed!'); })
  .pipe(browserSync.reload({stream: true}))
}

/**
 * Linting JS
 * Only linting our files - 3rd parties not checked
 */
function lintJS() {
  return gulp
  .src([
    "./js/**/*.js",
    "!.js/vendor/**/*.min.js"
  ])
  .pipe(plumber(plumberOptions))
  // .pipe(eslint({ fix: true })) // fix lint errors in the piped asset version
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
  .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'JS linted OK'); })
}

/**
 * Linting CSS
 * Only linting our files - 3rd parties not checked
 */
function lintCSS() {
  return gulp
  .src([
    "./css/**/*.scss"
  ])
  .pipe(plumber(plumberOptions))
  .pipe(stylelint({
    reporters: [
      {formatter: 'string', console: true, syntax: 'scss'}
    ],
    debug: true,
    fix: true // fix lint errors in the piped asset version
  }))
  .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'CSS linted OK'); })
}

/**
 * Copy fonts (plus ?) over
 */
function copy() {
  return gulp
  .src('./fonts/**/*')
  .pipe(plumber(plumberOptions))
  .pipe(gulp.dest('./assets/fonts'))
  .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'Fonts copied'); })
}

/**
 * Set up browser-sync
 */
function browserSyncServe(cb) {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    // proxy: {
    //   target: "site.test", // set to your local domain. Can't use server and proxy options
    // },
    https: true,
    port: 3333,
    cors: true,
    ui: {
      port: 3334
    },
    ghostMode: {
      clicks: true,
      scroll: true,
      location: true,
      forms: false
    },
    reloadOnRestart: true,
    logPrefix: "Browsersync running",
    logConnections: true,
    logFileChanges: true,
    // watch: true
  });
  cb();
}
function browserSyncReload() {
  browserSync.reload({stream: true});
}

/**
 * Watches folders and files to so we can trigger build tasks and live refresh
 */
function watchFiles() {
  watch(["./css/**/*.scss","./css/**/*.css"], gulp.series(["lintCSS", "devStyles", "prodStyles"]));
  watch("./js/**/*.js", gulp.series(["lintJS", "devScripts", "prodScripts"]));
  watch("./img/**/*", gulp.series(["images"]));
  watch([
      './assets/**',
      './content/**',
      './layouts/**',
      './pages/**',
      './partials/**'
  ]).on('change', browserSyncReload);
};

/**
 * Check Gulp can run
 */
function check(cb) {
  console.log('Gulp OK');
  cb();
}

/**
 * Check environment variables
 */
function checkEnvs(cb) {
  console.log("NODE_ENV = " + process.env.NODE_ENV);
  console.log("BABEL_ENV = " + process.env.BABEL_ENV);
  console.log("TEST_ENV = " + process.env.TEST_ENV);
  cb();
}

/**
 * Helper functions
 * @param error Error to output
 */
function errorAlert(error) {
  console.log('\x1b[31m%s\x1b[0m', `ERROR: ${error.toString()}`); //Prints Error to Console
  this.emit("end"); //End function
}

/**
 * Export available Gulp tasks
 */
exports.check = check;
exports.checkEnvs = checkEnvs;
exports.clean = clean;
exports.cleanCache = cleanCache;
exports.copy = copy;
exports.lintJS = lintJS;
exports.lintCSS = lintCSS;
exports.images = images;
exports.devStyles = devStyles;
exports.devScripts = devScripts;
exports.prodStyles = prodStyles;
exports.prodScripts = prodScripts;
exports.browserSyncServe = browserSyncServe;
exports.browserSyncReload = browserSyncReload;
exports.watchFiles = watchFiles;

// default, dev and prod tasks
exports.default = series(check, clean, cleanCache, copy, images, lintCSS, devStyles, prodStyles, lintJS, devScripts, prodScripts, browserSyncServe, watchFiles);
exports.dev = series(check, clean, copy, images, lintCSS, devStyles, lintJS, devScripts, browserSyncServe, watchFiles);
exports.prod = series(check, checkEnvs, clean, cleanCache, copy, images, lintCSS, devStyles, prodStyles, lintJS, devScripts, prodScripts);

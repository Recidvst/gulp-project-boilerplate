/**
 * Init Gulp plugins
 */
var gulp = require("gulp"),
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
  browserSync = require("browser-sync").create();

/**
 * Plumber options
 * @type {{errorHandler: errorAlert}}
 */
var plumberOptions = {
  errorHandler: errorAlert
};

/**
 * What browsers we want to support
 * @type {{browsers: string[], cascade: boolean}}
 */
var autoPrefixerOptions = {
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
var stylesheets = [
  './css/app.scss' // other stylesheets imported into this one
];

/**
 * Declare all the JavaScript for the development and production builds
 * @type {string[]}
 */
var javascript = [
  './js/vendor/**/*.js',
  './js/app.js'
];

/**
 * List available Gulp tasks
 */
gulp.task("default", [
  "check",
  "clean",
  "copy",
  "styles",
  "scripts",
  "lint",
  "images",
  "browser-sync",
  "watch"
]);
gulp.task("dev", [
  "check",
  "clean",
  "copy",
  "styles",
  "scripts",
  "lint",
  "images",
  "browser-sync",
  "watch"
]);
gulp.task("prod", [
  "check",
  "clean",
  "cache-clean",
  "copy",
  "styles",
  "scripts",
  "lint",
  "images"
]);

/**
 * Let's keep our asset folders clean and tidy - clean assets
 */
gulp.task("clean", function(cb) {
  return del.sync(["assets/*"]);
});

/**
 * Clear cache plugin
 */
gulp.task('cache-clean', function(cb) {
  return cache.clearAll()
});

/**
 * Build stylesheets
 */
gulp.task("styles", function() {

  // Development CSS
  gulp.src(stylesheets)
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

  // Production CSS
  gulp.src(stylesheets)
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
      .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Styles built!'); })

});

/**
 * Build scripts
 */
gulp.task('scripts', function () {
  // Development JS
  gulp.src(javascript)
      .pipe(plumber(plumberOptions))
      .pipe(sourcemaps.init())
      .pipe(concat({path: 'app.js', stat: {mode: 0777}}))
      .pipe(uglify({warnings: 'verbose'}))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./assets/js'))
      .pipe(browserSync.reload({stream: true}))

  // Production JS
  gulp.src(javascript)
      .pipe(plumber(plumberOptions))
      .pipe(concat({path: 'app.js', stat: {mode: 0777}}))
      .pipe(uglify({warnings: 'verbose'}))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./assets/js'))
      .on('end', (e) => { console.log('\x1b[32m%s\x1b[0m', 'Scripts built!'); })
});

/**
 * Image optimisation for images dedicated to the theme
 */
gulp.task('images', function () {
  gulp.src('./img/**/*')
      .pipe(plumber(plumberOptions))
      .pipe(cache(imagemin({optimizationLevel: 3, progressive: true, interlaced: true, verbose: true})))
      .pipe(gulp.dest('./assets/img'))
      .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'Images compressed!'); })
      .pipe(browserSync.reload({stream: true}))
});

// only linting our files - 3rd parties not checked
gulp.task('lint', function () {
  gulp
    .src([
      "./js/**/*.js",
      "!js/vendor/**/*.min.js"
    ])
      .pipe(plumber(plumberOptions))
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

/**
 * Copy fonts (plus ?) over
 */
gulp.task('copy', function () {
  gulp.src('./src/fonts/**/*')
      .pipe(plumber(plumberOptions))
      .pipe(gulp.dest('./assets/fonts'))
      .on('end', (e) => { console.log('\x1b[36m%s\x1b[0m', 'Fonts copied!'); })
});

/**
 * browser-sync
 */
gulp.task("browser-sync", function() {
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
});

/**
 * Watches folders and files to so we can trigger build tasks and live refresh
 */
gulp.task("watch", function() {
  gulp.watch("./css/**/*.scss", ["styles"]).on('change', browserSync.reload);
  gulp.watch("./css/**/*.css", ["styles"]).on('change', browserSync.reload);
  gulp.watch("./js/**/*.js", ["scripts"]).on('change', browserSync.reload);
  gulp.watch("./img/**/*", ["images"]).on('change', browserSync.reload);
  gulp.watch([
      './assets/**',
      './content/**',
      './layouts/**',
      './pages/**',
      './partials/**'
  ]).on('change', browserSync.reload);
});

/**
 * check working
 */
gulp.task("check", function() {
  console.log('Gulp OK');
});

/**
 * Helper functions
 * @param error Error to output
 */
function errorAlert(error) {
  console.log('\x1b[31m%s\x1b[0m', `ERROR: ${error.toString()}`); //Prints Error to Console
  this.emit("end"); //End function
}

var gulp = require("gulp");
var sass = require("gulp-sass");
var header = require("gulp-header");
var cleanCSS = require("gulp-clean-css");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify-es").default;
var pkg = require("./package.json");
var browserSync = require("browser-sync").create();
const merge = require('merge-stream')

// Copy third party libraries from /node_modules into /vendor
gulp.task("vendor", function () {
  // Bootstrap
  // gulp.src([
  //     './node_modules/bootstrap/dist/**/*',
  //     '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
  //     '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
  //   ])
  //   .pipe(gulp.dest('./client/vendor/bootstrap'))

  // Semantic UI
  return merge(
    gulp
      .src(["./node_modules/semantic-ui-css/**"])
      .pipe(gulp.dest("./client/vendor/semantic-ui-css")),

    // Font Awesome
    gulp
      .src([
        "./node_modules/font-awesome/**/*",
        "!./node_modules/font-awesome/{less,less/*}",
        "!./node_modules/font-awesome/{scss,scss/*}",
        "!./node_modules/font-awesome/.*",
        "!./node_modules/font-awesome/*.{txt,json,md}"
      ])
      .pipe(gulp.dest("./client/vendor/font-awesome")),

    // jQuery
    gulp
      .src([
        "./node_modules/jquery/dist/*",
        "!./node_modules/jquery/dist/core.js"
      ])
      .pipe(gulp.dest("./client/vendor/jquery")),

    // jQuery Easing
    gulp
      .src(["./node_modules/jquery.easing/*.js"])
      .pipe(gulp.dest("./client/vendor/jquery-easing")),

    // Simple Line Icons
    gulp
      .src(["./node_modules/simple-line-icons/fonts/**"])
      .pipe(gulp.dest("./client/vendor/simple-line-icons/fonts")),

    gulp
      .src(["./node_modules/simple-line-icons/css/**"])
      .pipe(gulp.dest("./client/vendor/simple-line-icons/css"))
  )
});

// Compile SCSS
gulp.task("css:compile", function () {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(
      sass
        .sync({
          outputStyle: "expanded"
        })
        .on("error", sass.logError)
    )
    .pipe(gulp.dest("./client/css"));
});

// Minify CSS
gulp.task("css:minify", function () {
  return gulp
    .src(["./client/css/*.css", "!./client/css/*.min.css"])
    .pipe(cleanCSS())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(gulp.dest("./client/css"))
    .pipe(browserSync.stream());
});

// // CSS
// gulp.task("css", ["css:compile", "css:minify"]);
gulp.task("css", gulp.series("css:compile", "css:minify"));

// Minify JavaScript
gulp.task("js:minify", function (done) {
  gulp
    .src(["./client/js/*.js", "!./client/js/*.min.js"])
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min"
      })
    )
    .pipe(gulp.dest("./client/js"))
    .pipe(browserSync.stream());
  done()
});

// // JS
// gulp.task("js", gulp.series("js:minify"));

// Default task
// gulp.task("default", gulp.parallel("css", "js", "vendor"));
// gulp.task("default", ["css", "js", "vendor"]);

// // Configure the rowserSync task
// gulp.task("browserSync", function (done) {
//   browserSync.init({
//     server: {
//       baseDir: "./client/"
//     }
//   });
//   done()
// });

// Dev task
// gulp.task("dev", ["css", "js", "browserSync"], function () {
gulp.task("dev:watch", function () {
  gulp.watch("./scss/*.scss", ["css"]);
  gulp.watch("./client/js/*.js", ["js"]);
  gulp.watch("./client/*.html", browserSync.reload);
});

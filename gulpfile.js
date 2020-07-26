const { src, dest, parallel } = require('gulp');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify');


function js() {
  return src(['index.js', 'index.route.js', 'server/**/*.js'], { sourcemaps: false })
    // .pipe(uglify())
    .pipe(concat('app.prod.js'))
    .pipe(dest('build/prod', { sourcemaps: false }));
}

exports.js = js;
exports.default = parallel(js);

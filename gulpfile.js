const {src, dest, series, parallel, watch} = require('gulp'),
    sass = require('gulp-sass')(require('sass')),
    rename = require('gulp-rename'),
    del = require('del'),
    prefixer = require('gulp-autoprefixer'),
    browserSync = require('browser-sync'),
    gulpStylelint = require('gulp-stylelint'),
    gulpSprite = require('gulp-svg-sprite'),
    uglifyJs = require('gulp-uglify'),
    gulpClean = require('gulp-clean-css'),
    svgo = require('svgo'),
    svgmin = require('gulp-svgmin'),
    fileInclude = require('gulp-include'),
    gcmq = require('gulp-group-css-media-queries'),
    pug = require('gulp-pug'),
    pugLinter = require('gulp-pug-linter'),
    plumber = require('gulp-plumber'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    formatHtml = require('gulp-format-html'),
    gutil = require('gulp-util'),
    vftp = require('vinyl-ftp'),
    foldername = require('path');

const path = {
    src: {
        pug: 'src/templates/*.pug',
        scss: 'src/scss/*.scss',
        css: 'src/css/*.css',
        js: 'src/js/*.js',
        img: 'src/img/**/*.+(png|jpg|jpeg|gif|svg|webp|ico|xml|webmanifest)',
        fonts: 'src/fonts/*.+(woff|woff2)',
        svg: 'src/svg/*.svg'
    },
    build: {
        pug: 'build',
        css: 'build/css',
        js: 'build/js',
        img: 'build/img',
        fonts: 'build/fonts'
    },
    watch: {
        all: 'build',
        // css: 'src/css/*.css',
        pug: 'src/templates/**/*.pug',
        scss: 'src/scss/**/*.scss',
        js: 'src/js/**/*.js',
        img: 'src/img/**/*.+(png|jpg|jpeg|gif|svg|webp|ico|xml|webmanifest)',
        fonts: 'src/fonts/*.+(woff|woff2)',
        svg: 'src/svg/*.svg'
    }
}

function lintCss() {
    return src(path.src.scss)
        .pipe(gulpStylelint({
            reporters: [
                {
                    failAfterError: true,
                    formatter: 'string',
                    console: true
                }
            ]
        }))
}

function server() {
    browserSync.init({
        server: {
            baseDir: "build"
        },
        notify: false
    });
    browserSync.watch(path.watch.all, browserSync.reload);
}

function clean() {
    return del(['build/**']);
}

function css() {
    return src(path.src.scss)
        .pipe(sass({
            outputStyle: 'expanded',
            indentWidth: 4
        }))
        .pipe(prefixer({
            cascade: false,
            overrideBrowserslist: ['last 8 versions', '> 1%', 'not dead'],
            browsers: [
                'Android >= 4',
                'Chrome >= 20',
                'Firefox >= 24',
                'Explorer >= 11',
                'iOS >= 6',
                'Opera >= 12',
                'Safari >= 6',
            ]
        }))
        .pipe(gcmq())
        .pipe(gulpClean({
            level: 2
        }))
        .pipe(dest(path.build.css))
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(dest(path.build.css))
};

function html() {
    return src(path.src.pug)
        .pipe(plumber())
        .pipe(pugLinter({reporter: 'default'}))
        .pipe(pug({
            pretty: "\t"
        }))
        .pipe(plumber.stop())
        .pipe(replace('&gt;', '>'))
        .pipe(formatHtml({
            "indent_size": 4
        }))
        .pipe(dest(path.build.pug))
}

function scripts() {
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(uglifyJs())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(dest(path.build.js))
}

function optImages() {
    return src(path.src.img)
        .pipe(dest(path.build.img))
}

function fonts() {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
}

function svgSprite() {
    return src(path.src.svg)
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(gulpSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg",
                    render: {
                        scss: {
                            dest: '../../../src/scss/base/_sprite.scss',
                            template: 'src/scss/base/_sprite_template.scss'
                        }
                    }
                },
            },
        }))
        .pipe(dest(path.build.img))
}

// function ftpUpload() {
// 	let conn = vftp.create( {
//         host:     'b91201x9.beget.tech',
//         user:     'b91201x9_deploy',
//         password: 'lb%C4lyO',
//         parallel: 10,
//         log:      gutil.log
//     } );

// 	let globs = [
//         "build/**/*"
//     ];

// 	let pathName = foldername.basename(__dirname);
// 	conn.rmdir('/'+pathName+'');
// 	return src( globs, { base: './build', buffer: false } )
//         .pipe( conn.newer( '/'+ pathName +'/' ) )
//         .pipe( conn.dest( '/'+ pathName +'/' ) );
// }

function watching() {
    watch(path.watch.pug, html);
    watch(path.watch.scss, css);
    watch(path.watch.js, scripts);
    watch(path.watch.img, optImages);
    watch(path.watch.svg, svgSprite);
    watch(path.watch.fonts, fonts);
}

exports.clean = clean;
exports.css = css;
exports.lintCss = lintCss;
exports.html = html;
exports.scripts = scripts;
exports.optImages = optImages;
exports.font = fonts;
exports.svgSprite = svgSprite;
// exports.ftpUpload = ftpUpload;

exports.default = series(clean, parallel(html, css, scripts, optImages, fonts, svgSprite), parallel(watching, server));
exports.build = series(clean, parallel(html, css, scripts, optImages, fonts, svgSprite));

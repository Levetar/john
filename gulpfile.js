
let project_name = "dist";
let src_folder = "#src";


let { src, dest } = require("gulp");
let gulp = require("gulp");
//обновление браузера
let browsersync = require("browser-sync").create();
//сборщик кусков кода
let fileinclude = require("gulp-file-include");
//удаление dist
let del = require("del");
let scss = require("gulp-sass")(require("sass"));
let clean_css = require("gulp-clean-css");
let rename = require("gulp-rename");
let autoprefixer = require("gulp-autoprefixer");
let group_media = require("gulp-group-css-media-queries");
let uglify = require("gulp-uglify-es").default;
let imagemin = require("gulp-imagemin");
let webp = require("imagemin-webp");
let webphtml = require("gulp-webp-html");
let webpcss = require("gulp-webpcss");
let ttf2woff = require("gulp-ttf2woff");
let ttf2woff2 = require("gulp-ttf2woff2");
let fs = require("fs");


let path = {
  //выгружаем готовые файлы
  build: {
    html: project_name + "/",
    js: project_name + "/js/",
    css: project_name + "/css/",
    images: project_name + "/img/",
    fonts: project_name + "/fonts/",
  },
  //путь к исходникам
  src: {
    favicon: src_folder + "/img/favicon.{jpg,png,svg,gif,ico,webp}",
    html: [src_folder + "/**/*.html", "!" + src_folder + "/_*.html"],
    js: [src_folder + "/js/script.js"],
    css: src_folder + "/scss/style.scss",
    images: [
      src_folder + "/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
      "!**/favicon.*",
    ],
    fonts: src_folder + "/fonts/*.ttf",
  },
  //слушаем файлы
  watch: {
    html: src_folder + "/**/*.html",
    js: src_folder + "/**/*.js",
    css: src_folder + "/scss/**/*.scss",
    images: src_folder + "/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
  },
  //удаление папки при каждом запуске
  clean: "./" + project_name + "/",
};

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./" + project_name + "/",
    },
    notify: false,
    port: 3000,
  });
}

function html() {
  return (
    src(path.src.html)
      .pipe(fileinclude())
      //.pipe(webphtml())
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream())
  );
}


function css() {
  return (
    src(path.src.css, {})
      .pipe(
        scss({ outputStyle: "expanded" }).on("error", scss.logError)
      )
      .pipe(group_media())
      .pipe(
        autoprefixer({
          overrideBrowserslist: ["last 5 versions"],
          cascade: true,
        })
      )
      .pipe(webpcss())
      .pipe(dest(path.build.css))
      .pipe(clean_css())
      .pipe(
        rename({
          extname: ".min.css",
        })
      )
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
  );
}

function js() {
  return (
    src(path.src.js)
      .pipe(fileinclude())
      .pipe(dest(path.build.js))
      .pipe(uglify())
      .pipe(
        rename({
          extname: ".min.js",
        })
      )
      .pipe(dest(path.build.js))
      .pipe(browsersync.stream())
  );
}

function images() {
  return (
    src(path.src.images)
      .pipe(
        imagemin([
          webp({
            quality: 70,
          }),
        ])
      )
      .pipe(
        rename({
          extname: ".webp",
        })
      )
      .pipe(dest(path.build.images))
      .pipe(src(path.src.images))
      .pipe(
        imagemin({
          progressive: true,
          svgoPlugins: [{ removeViewBox: false }],
          interlaced: true,
          optimizationLevel: 3, // 0 to 7
        })
      )
      .pipe(dest(path.build.images))
      .pipe(browsersync.stream())
  );
}

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

function fontsStyle() {
  let file_content = fs.readFileSync(src_folder + "/scss/fonts.scss");
  if (file_content == "") {
    fs.writeFile(src_folder + "/scss/fonts.scss", "", cb);
    fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              src_folder + "/scss/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
  return src(path.src.html).pipe(browsersync.stream());
}

function cb() {}

function clean() {
  return del(path.clean);
}

function watchFiles() {
  //пути отслеж файлов
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.images], images);
}

let build = gulp.series(clean, 
  gulp.parallel(html, css, js, images, fonts),
  fontsStyle
  );

let watch = gulp.parallel(build, watchFiles, browserSync);

exports.build = build;
exports.watch = watch;
exports.default = watch;
exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.fontsStyle = fontsStyle;











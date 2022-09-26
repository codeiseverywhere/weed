/*jslint nomen: true*/
/*global require, console, __dirname*/

var i, j, key,
    crypto = require('crypto'),
    stream = require('stream'),
    buffer = require('buffer'),
    process = require("process"),
    gulp = require('gulp'),
    watch = require('gulp-watch'),
    notify = require('gulp-notify'),
    sourcemaps = require('gulp-sourcemaps'),
    sass = require('gulp-sass'),
    cssimport = require('gulp-cssimport'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    gulp_handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    declare = require('gulp-declare'),
    iconfont = require('gulp-iconfont'),
    consolidate = require('gulp-consolidate'),
    Handlebars = require('handlebars'),
    rename = require('gulp-rename'),
    plumber = require('gulp-plumber'),
    path = require('path'),
    merge = require('gulp-merge'),
    assetbuilder = require('asset-builder'),
    fileinclude = require('gulp-file-include'),
    manifest_chain = [],
    shopify_upload = require("gulp-shopify-upload"),
    streamLimiter = require("gulp-stream-limiter"),
    map_stream = require("map-stream"),
    gulp_util = require("gulp-util"),
    globs = {
        "script.js": []
    },
    allScriptFiles = [],
    bannedGlobs = [],
    iconPaths = [],
    sassPaths = ["."],
    successPic,
    failurePic,
    iconFontTmpl,
    my_theme_name,
    scriptTasks = [],
    watchScriptTasks = [],
    api_keys = require("./api_keys.json"),
    shopify_options = {
        "basePath": "theme_files/"
    };

function processManifest(basePath) {
    "use strict";
    var manifest = assetbuilder(path.join(basePath, "manifest.json"));

    if (my_theme_name === undefined) {
        my_theme_name = manifest.config.theme_name;
    }

    iconPaths.push(path.join(basePath, "assets/icons/*.svg"));

    if (basePath !== ".") {
        sassPaths.push(path.resolve(path.join(basePath, ".")));
    }
    manifest_chain.push(manifest);

    if (manifest.config.base_theme !== undefined) {
        //Recursively process parent theme's manifest, too.
        processManifest(manifest.config.base_theme);
    } else {
        //Success/failure notification images come from the lowest theme
        //in the chain.
        successPic = path.join(basePath, 'assets/img/huemor_logo.png');
        failurePic = path.join(basePath, 'assets/img/sad_onions.png');
        iconFontTmpl = path.join(basePath, "./assets/tmpl/icon_manifest.scss.hbs");
    }
}

//Find base themes, if any.
processManifest(".");

//Only process our own manifest for JS globs.
//We assume parent themes will be generating their own HBS, JS etc.
//SASS gets processed a different way (base theme files can be referenced)
manifest_chain[0].forEachDependency("js", function (dep) {
    "use strict";

    if (dep.name === "script.js" || manifest_chain[0].config.no_concat.indexOf(dep.name) === -1) {
        globs["script.js"] = globs["script.js"].concat(dep.globs);
    } else {
        globs[dep.name] = dep.globs;
    }

    allScriptFiles = allScriptFiles.concat(dep.globs);
});

for (i = 0; i < globs["script.js"].length; i += 1) {
    for (j = 0; j < manifest_chain[0].config.no_include.length; j += 1) {
        if (globs["script.js"][i].indexOf(manifest_chain[0].config.no_include[j]) !== -1) {
            bannedGlobs.unshift(i);
        }
    }
}

for (i = 0; i < bannedGlobs.length; i += 1) {
    globs["script.js"].splice(bannedGlobs[i], 1);
}

function build_templates() {
    "use strict";
    return gulp.src(["./components/**/*.hbs", "./layouts/**/*.hbs"], { allowEmpty: true })
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Template error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(gulp_handlebars({
            "handlebars": Handlebars
        }))
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declare({
            namespace: my_theme_name,
            noRedeclare: true,
            processName: function(filePath) {
                var filePath = path.relative(process.cwd(), filePath),
                    parts = filePath.split(path.sep),
                    templateName = path.basename(parts.pop(), '.js');
                
                for (i = 0; i < parts.length; i += 1) {
                    while (parts[i] === "components" || parts[i] === "layout") {
                        parts.splice(i, 1);
                    }
                }
                
                parts.push(templateName);
                
                return parts.join('.');
            }
        }))
        .pipe(concat('interim/handlebars.js'))
        .pipe(gulp.dest('./build'))
        .pipe(notify({
            "title": "Templates compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task('templates', build_templates);

for (key in globs) {
    if (globs.hasOwnProperty(key)) {
        //Capture key as a closure variable
        (function (key) {
            "use strict";
            function build_scripts() {
                function handle_error(err) {
                    notify.onError({
                        "title": "Scripts error.",
                        "message": "<%= error.message %>",
                        "icon": failurePic
                    })(err);
                    console.log(err);
                    this.emit('end');
                }

                return gulp.src(globs[key], { allowEmpty: true })
                    .pipe(plumber({
                        errorHandler: handle_error
                    }))
                    //.pipe(sourcemaps.init())
                    .pipe(concat('./' + key))
                    //.pipe(uglify({
                    //    "compress": {
                    //        "drop_debugger": false
                    //    }
                    //}))
                    //.pipe(sourcemaps.write("./debug"))
                    .pipe(rename({
                        extname: ".js.liquid"
                    }))
                    .pipe(gulp.dest("./theme_files/assets"))
                    .pipe(notify({
                        "title": "Scripts compiled.",
                        "message": "Compiled <%= file.relative %>",
                        "icon": successPic
                    }));
            }
            Object.defineProperty(build_scripts, "name", {value: build_scripts.name + "_" + key});
            
            gulp.task('scripts_only:' + key, build_scripts);
            gulp.task('scripts:' + key, gulp.series(build_templates, build_scripts));

            scriptTasks.push("scripts:" + key);
        }(key));
    }
}

gulp.task('scripts', gulp.parallel.apply(gulp, scriptTasks));

function build_iconfont() {
    "use strict";
    return gulp.src(iconPaths, { allowEmpty: true })
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Icon fonts error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(iconfont({
            fontName: 'icon',
            appendUnicode: true
        }))
        .on('glyphs', function (glyphs, options) {
            gulp.src(iconFontTmpl)
                .pipe(plumber({
                    errorHandler: function (err) {
                        notify.onError({
                            "title": "Icon fonts error.",
                            "message": "<%= error.message %>",
                            "icon": failurePic
                        })(err);
                        this.emit('end');
                    }
                }))
                .pipe(consolidate("handlebars", {
                    glyphs: glyphs,
                    fontName: 'icon',
                    fontPath: '../build/fonts/',
                    nonce: Math.floor(Math.random() * 10000)
                }))
                .pipe(rename({
                    dirname: "interim",
                    extname: ""
                }))
                .pipe(notify({
                    "title": "Icon fonts compiled.",
                    "message": "Compiled <%= file.relative %>",
                    "icon": successPic
                }))
                .pipe(gulp.dest("./build"));
        })
        .pipe(notify({
            "title": "Icon fonts compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }))
        .pipe(gulp.dest('./theme_files/assets/'));
}
gulp.task('iconfont', build_iconfont);

Handlebars.registerHelper("codepoint", function (codepoint) {
    "use strict";
    console.log(codepoint[0]);
    return "\\" + codepoint[0].charCodeAt().toString(16).toUpperCase();
});

function build_styles() {
    "use strict";
    var included_files = [];

    return gulp.src(["./stylesheets/*.sass", "./stylesheets/*.scss"], { allowEmpty: true })
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Styles error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
            "includePaths": sassPaths
        }))
        //.pipe(cssimport({
        //    "includePaths": sassPaths
        //}))
        //TODO: Is on-server SCSS compilation better than
        //having autoprefixer?
        //Answer, 4 years later: NOPE
        //.pipe(autoprefixer({
            //"browsers": ['IE 8', '> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1'],
            //"remove": true
        //}))
        .pipe(rename({extname: ".css.liquid"}))
        .pipe(sourcemaps.write("./debug"))
        .pipe(gulp.dest("./theme_files/assets"))
        .pipe(notify({
            "title": "Stylesheets compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task('styles', build_styles);

/**
 * Gulp task: theme_templates
 * 
 * Copies theme templates from individual component and layout directories to
 * theme_files/templates. Only files in the templates subdirectory of a given
 * layout or component will be processed.
 * 
 * We can't enforce namespacing because basically all of the accepted template
 * names aren't camelcased.
 * 
 * Example:
 * 
 *  layouts/Product/templates/product.liquid => theme_files/templates/product.liquid
 */
function build_theme_templates() {
    "use strict";

    return gulp.src(["./components/**/templates/**/*.liquid", "./layouts/**/templates/**/*.liquid"])
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Theme templates error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rename(function (thispath) {
            var split = thispath.dirname.split(path.sep);
            thispath.dirname = split.slice(2).join(path.sep);

            return thispath;
        }))
        .pipe(gulp.dest("./theme_files/templates"))
        .pipe(notify({
            "title": "Theme templates compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task("theme_templates", build_theme_templates);

/**
 * Gulp task: theme_snippets
 * 
 * Copies theme snippets from individual component and layout directories to
 * theme_files/snippets. Only files in the snippets subdirectory of a given
 * layout or component will be processed.
 * 
 * This task enforces a naming convention: All snippets will be prefixed with
 * the name of the component or layout they came from. If the filename already
 * matches the component or layout name, no prefixing will occur.
 * 
 * Example:
 * 
 *  layouts/Product/snippets/form.liquid => theme_files/snippets/Product-form.liquid
 *  layouts/Product/snippets/Product.liquid => theme_files/snippets/Product.liquid
 */
function build_theme_snippets() {
    "use strict";

    return gulp.src(["./components/**/snippets/**/*.liquid", "./layouts/**/snippets/**/*.liquid"])
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Theme snippets error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rename(function (thispath) {
            var split = thispath.dirname.split(path.sep),
                component_name = split[0];
            
            thispath.dirname = split.slice(2).join(path.sep);

            if (thispath.basename !== component_name) {
                thispath.basename = component_name + "-" + thispath.basename;
            }

            return thispath;
        }))
        .pipe(gulp.dest("./theme_files/snippets"))
        .pipe(notify({
            "title": "Theme snippets compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task("theme_snippets", build_theme_snippets);

/**
 * Gulp task: theme_sections
 * 
 * Copies theme sections from individual component and layout directories to
 * theme_files/sections. Only files in the sections subdirectory of a given
 * layout or component will be processed.
 * 
 * This task enforces a naming convention: All sections will be prefixed with
 * the name of the component or layout they came from. If the filename already
 * matches the component or layout name, no prefixing will occur.
 * 
 * Example:
 * 
 *  components/SiteHeader/sections/SiteHeader.liquid => theme_files/sections/SiteHeader.liquid
 *  layouts/Product/sections/nosizing.liquid => theme_files/sections/Product-nosizing.liquid
 */
function build_theme_sections() {
    "use strict";

    return gulp.src(["./components/**/sections/**/*.liquid", "./layouts/**/sections/**/*.liquid"])
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Theme sections error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rename(function (thispath) {
            var split = thispath.dirname.split(path.sep),
                component_name = split[0];
            
            thispath.dirname = split.slice(2).join(path.sep);

            if (thispath.basename !== component_name) {
                thispath.basename = component_name + "-" + thispath.basename;
            }

            return thispath;
        }))
        .pipe(gulp.dest("./theme_files/sections"))
        .pipe(notify({
            "title": "Theme sections compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task("theme_sections", build_theme_sections);

/**
 * Gulp task: theme_layout
 * 
 * Copies theme layouts from individual component and layout directories to
 * theme_files/layouts. Only files in the layouts subdirectory of a given
 * layout or component will be processed.
 * 
 * We cannot enforce namespacing because the default theme template is `theme`,
 * which isn't a valid component name.
 * 
 * Example:
 * 
 *  layouts/Product/layout/product.liquid => theme_files/layout/product.liquid
 */
function build_theme_layout() {
    "use strict";

    return gulp.src(["./components/**/layout/**/*.liquid", "./layouts/**/layout/**/*.liquid"])
        .pipe(plumber({
            errorHandler: function (err) {
                notify.onError({
                    "title": "Theme layout error.",
                    "message": "<%= error.message %>",
                    "icon": failurePic
                })(err);
                this.emit('end');
            }
        }))
        .pipe(rename(function (thispath) {
            var split = thispath.dirname.split(path.sep);
            thispath.dirname = split.slice(2).join(path.sep);

            return thispath;
        }))
        .pipe(gulp.dest("./theme_files/layout"))
        .pipe(notify({
            "title": "Theme layout compiled.",
            "message": "Compiled <%= file.relative %>",
            "icon": successPic
        }));
}
gulp.task("theme_layout", build_theme_layout);

function watch_iconfont() {
    "use strict";
    return gulp.watch(["./assets/icons/*.svg", iconFontTmpl], gulp.series(["iconfont"]));
}
gulp.task('watch:iconfont', watch_iconfont);

function watch_styles() {
    "use strict";
    return gulp.watch(['./**/*.scss', './**/*.sass'], gulp.series(["styles"]));
}
gulp.task('watch:styles', watch_styles);

function watch_templates() {
    "use strict";
    return gulp.watch(["./components/**/*.hbs", "./layouts/**/*.hbs"], gulp.series(["templates"]));
}
gulp.task('watch:templates', watch_templates);

function watch_theme_templates() {
    return gulp.watch(["./components/**/templates/**/*.liquid", "./layouts/**/templates/**/*.liquid", "./components/**/templates/**/*.json", "./layouts/**/templates/**/*.json"], gulp.series(["theme_templates"]));
}
gulp.task("watch:theme_templates", watch_theme_templates);

function watch_theme_snippets() {
    return gulp.watch(["./components/**/snippets/**/*.liquid", "./layouts/**/snippets/**/*.liquid"], gulp.series(["theme_snippets"]));
}
gulp.task("watch:theme_snippets", watch_theme_snippets);

function watch_theme_sections() {
    return gulp.watch(["./components/**/sections/**/*.liquid", "./layouts/**/sections/**/*.liquid"], gulp.series(["theme_sections"]));
}
gulp.task("watch:theme_sections", watch_theme_sections);

function watch_theme_layout() {
    return gulp.watch(["./components/**/layout/**/*.liquid", "./layouts/**/layout/**/*.liquid"], gulp.series(["theme_layout"]));
}
gulp.task("watch:theme_layout", watch_theme_layout);

function watch_shopify() {
    "use strict";
    var limiter = streamLimiter(1), //because the shopify upload doesn't bother
        hashes = {};
    
    return watch(['theme_files/(assets|layout|snippets|templates|locales|sections)/**', 'theme_files/config/settings_schema.json'])
        // Attempt to filter non-novel file events (e.g. files being resaved with no changes)
        .pipe(map_stream(function (file, cbk) {
            var file_stream, file_buffer, chunks, file_hasher, new_hash;

            if (file.isNull()) {
                // Treat files with no contents as always being novel events.
                return cbk(null, file);
            }

            file_hasher = crypto.createHash("sha256");
            file_hasher.setEncoding("hex")

            // Gulp documentation states that piped files can have either a
            // Node stream or a buffer. We need a stream to pipe into the
            // crypto API, but doing so also consumes the stream, which we need
            // to pass onto further steps. We can't clone it because cloned
            // streams don't flow until ALL the clones pipe, which won't work
            // since whether or not one stream pipes depends on the contents of
            // the other.
            // 
            // So we need both to exist - after which we consume the stream and
            // pass on the buffer.
            if (file.isBuffer()) {
                file_buffer = file.contents;

                file_stream = new stream.Readable();
                file_stream._read = () => {};
                file_stream.push(file_buffer);
                file_stream.push(null);

                file_stream.pipe(file_hasher);
                file_stream.once("end", () => {
                    file_hasher.end();
                    new_hash = file_hasher.read();

                    if (hashes[file.path] !== new_hash) {
                        console.log("File " + file.path + " changed to " + new_hash);
                        hashes[file.path] = new_hash;
                        cbk(null, file);
                    } else {
                        cbk(); //drop the event
                    }
                });
            } else if (file.isStream()) {
                file_stream = file.contents;
                file_stream.once('error', (err) => {
                    cbk(err);
                });
                
                file_stream.on('data', (chunk) => {
                    chunks.push(chunk);
                    file_hasher.write(chunk);
                });
                
                file_stream.once('end', () => {
                    file_hasher.end();
                    new_hash = file_hasher.read();

                    if (hashes[file.path] !== new_hash) {
                        console.log("File " + file.path + " changed to " + new_hash);
                        hashes[file.path] = new_hash;
                        file.contents = buffer.Buffer.concat(chunks);
                        cbk(null, file);
                    } else {
                        cbk(); //drop the event
                    }
                });
            } else {
                // Who knows what happened - all cases should have been handled.
                cbk();
            }
        }))
        .pipe(limiter.throttler())
        .pipe(shopify_upload(api_keys.shopify.api_key,
                             api_keys.shopify.password,
                             api_keys.shopify.url,
                             api_keys.shopify.theme_id,
                             shopify_options))
        .pipe(limiter.unthrottler());
}
gulp.task("watch:shopify", watch_shopify);

function deploy() {
    "use strict";
    var limiter = streamLimiter(1); //because the shopify upload doesn't bother
    
    return gulp.src(['./theme_files/+(assets|layout|snippets|locales|sections)/**', './theme_files/templates/*.liquid'])
        .pipe(limiter.throttler())
        .pipe(shopify_upload(api_keys.shopify_production.api_key,
                             api_keys.shopify_production.password,
                             api_keys.shopify_production.url,
                             api_keys.shopify_production.theme_id,
                             shopify_options))
        .pipe(limiter.unthrottler());
}
gulp.task("deploy", deploy);

function push() {
    "use strict";
    var limiter = streamLimiter(1); //because the shopify upload doesn't bother
    
    return gulp.src(['./theme_files/+(assets|layout|snippets|locales|sections)/**', './theme_files/templates/*.liquid'])
        .pipe(limiter.throttler())
        .pipe(shopify_upload(api_keys.shopify.api_key,
                             api_keys.shopify.password,
                             api_keys.shopify.url,
                             api_keys.shopify.theme_id,
                            shopify_options))
        .pipe(limiter.unthrottler());
}
gulp.task("push", push);

for (key in globs) {
    if (globs.hasOwnProperty(key)) {
        function watch_scripts() {
            "use strict";
            return gulp.watch(globs[key], gulp.series(["scripts_only:" + key]));
        }
        Object.defineProperty(watch_scripts, "name", {value: watch_scripts.name + "_" + key});
        
        gulp.task('watch:scripts:' + key, watch_scripts);
        watchScriptTasks.push("watch:scripts:" + key);
    }
}

gulp.task('watch:scripts', gulp.parallel.apply(gulp, watchScriptTasks));

gulp.task('watch', gulp.parallel('watch:iconfont', 'watch:styles', 'watch:templates', 'watch:scripts', 'watch:theme_templates', 'watch:theme_snippets', 'watch:theme_sections', 'watch:theme_layout', 'watch:shopify'));
gulp.task('build', gulp.parallel('iconfont', 'styles', 'templates', 'scripts', 'theme_templates', 'theme_snippets', 'theme_sections', 'theme_layout'));
gulp.task('default', gulp.parallel('build', 'watch'));

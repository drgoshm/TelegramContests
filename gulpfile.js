const 
	gulp = require('gulp'),
	gulpif = require('gulp-if'),
	browsersync = require('browser-sync'),
	autoprefixer = require('gulp-autoprefixer'),
	sass = require('gulp-sass'),
	groupmediaqueries = require('gulp-group-css-media-queries'),
	mincss = require('gulp-clean-css'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify_es = require('gulp-uglify-es').default,
	rename = require('gulp-rename'),
	favicons = require('gulp-favicons'),
	replace = require('gulp-replace'),
	rigger = require('gulp-rigger'),
	plumber = require('gulp-plumber'),
	debug = require('gulp-debug'),
	concat = require('gulp-concat'),
	clean = require('gulp-clean'),
	yargs = require('yargs'),
	argv = yargs.argv;

let production = !!argv.prod;

const paths = {
	data: {
		src: [
			'./src/data/**/*.json'
		],
		dist: './dist/data/',
		watch: './src/data/**/*.json'
	},
	views: {
		src: [
			'./src/index.html',
			'./src/pages/*.html'
		],
		dist: './dist/',
		watch: './src/**/*.html'
	},
	styles: {
		src: './src/styles/**/*.{css,sass}',
		dist: './dist/styles/',
		watch: [
			'./src/styles/**/*.{css,sass}'
		]
	},
	scripts: {
		src: ['./src/js/**/*.js'],
		dist: './dist/js/',
		watch: [
			'./src/js/**/*.js'
		]
	},
	wasm: {
		src: ['./src/js/**/*.wasm'],
		dist: './dist/js/',
		watch: [
			'./src/js/**/*.wasm'
		]
	},
	images: {
		src: [
			'./src/img/**/*.{jpg,jpeg,png,gif,svg}',
			'!./src/img/svg/*.svg',
			'!./src/img/favicon.{jpg,jpeg,png,gif}'
		],
		dist: './dist/img/',
		watch: './src/img/**/*.{jpg,jpeg,png,gif,svg}'
	},
	webp: {
		src: './src/img/**/*_webp.{jpg,jpeg,png}',
		dist: './dist/img/',
		watch: './src/img/**/*_webp.{jpg,jpeg,png}'
	},
	fonts: {
		src: './src/fonts/**/*.{ttf,otf,woff,woff2}',
		dist: './dist/styles/fonts/',
		watch: './src/fonts/**/*.{ttf,otf,woff,woff2}'
	},
	favicons: {
		src: './src/img/favicon.{jpg,jpeg,png,gif,ico}',
		dist: './dist/img/favicons/',
	},
	server_config: {
		src: './src/.htaccess',
		dist: './dist/'
	}
};

const cleanFiles = () => gulp.src('./dist/*', {read: false})
	.pipe(clean())
	.pipe(debug({
		'title': 'Cleaning...'
	}));

const data = () => gulp.src(paths.data.src)
	.pipe(gulp.dest(paths.data.dist))
	.pipe(debug({
		'title': 'Data files'
	}));


const wasm = () => gulp.src(paths.wasm.src)
	.pipe(gulp.dest(paths.wasm.dist))
	.pipe(debug({
		'title': 'Wasm'
	}));

const fonts = () => gulp.src(paths.fonts.src)
	.pipe(gulp.dest(paths.fonts.dist))
	.pipe(debug({
		'title': 'Fonts files'
	}));

const views = () => gulp.src(paths.views.src)
	.pipe(rigger())
	//.pipe(gulpif(production, replace('bundle.css', 'bundle.min.css')))
	.pipe(gulpif(production, replace('bundle.js', 'bundle.min.js')))
	.pipe(gulp.dest(paths.views.dist))
	.pipe(debug({
		'title': 'HTML files'
	}))
	.on('end', browsersync.reload);

const styles = () => gulp.src(paths.styles.src)
	.pipe(gulpif(!production, sourcemaps.init()))
	.pipe(plumber())
	.pipe(sass())
	.pipe(groupmediaqueries())
	.pipe(gulpif(production, autoprefixer({
		browsers: ['last 12 versions', '> 1%', 'ie 8', 'ie 7']
	})))
	.pipe(gulpif(production, mincss({
		compatibility: 'ie8', level: {
			1: {
				specialComments: 0,
				removeEmpty: true,
				removeWhitespace: true
			},
			2: {
				mergeMedia: true,
				removeEmpty: true,
				removeDuplicateFontRules: true,
				removeDuplicateMediaBlocks: true,
				removeDuplicateRules: true,
				removeUnusedAtRules: false
			}
		}
	})))
	.pipe(gulpif(production, rename({
		suffix: '.min'
	})))
	.pipe(plumber.stop())
	.pipe(concat('bundle.min.css'))
	.pipe(gulpif(!production, sourcemaps.write('./maps/')))
	.pipe(gulp.dest(paths.styles.dist))
	.pipe(debug({
		'title': 'CSS files'
	}))
	.pipe(browsersync.stream());

const scripts = () => gulp.src(paths.scripts.src)
	//pipe(webpackStream(webpackConfig), webpack)
	.pipe(concat('bundle.js'))
	.pipe(gulpif(production, uglify_es({
		'compress': {
			'sequences': true,
			'properties': true,
			'dead_code': true,
			'drop_debugger': true,
			'unsafe': false,
			'unsafe_comps': false,
			'conditionals': true,
			'comparisons': true,
			'evaluate': true,
			'booleans': true,
			'loops': true,
			'unused': true,
			'hoist_funs': true,
			'keep_fargs': true,
			'keep_fnames': false,
			'hoist_vars': false,
			'if_return': true,
			'join_vars': true,
			'collapse_vars': false,
			'reduce_vars': false,
			'side_effects': true,
			'pure_getters': false,
			'pure_funcs': null,
			'negate_iife': false,
			'drop_console': true,
			'passes': 1,
			'global_defs': {}
		}})))
	.pipe(gulpif(production, rename({
		suffix: '.min'
	})))
	.pipe(gulp.dest(paths.scripts.dist))
	.pipe(debug({
		'title': 'JS files'
	}))
	.on('end', browsersync.reload);

const images = () => gulp.src(paths.images.src)
	.pipe(gulp.dest(paths.images.dist))
	.pipe(debug({
		'title': 'Images'
	}))
	.on('end', browsersync.reload);


const favs = () => gulp.src(paths.favicons.src)
	.pipe(favicons({
		icons: {
			appleIcon: true,
			favicons: true,
			online: false,
			appleStartup: false,
			android: false,
			firefox: false,
			yandex: false,
			windows: false,
			coast: false
		}
	}))
	.pipe(gulp.dest(paths.favicons.dist))
	.pipe(debug({
		'title': 'Favicons'
	}));

// eslint-disable-next-line no-undef
const server = () => {
	if(production) return;

	browsersync.init({
		server: './dist/',
		tunnel: true,
		notify: true
	});

	gulp.watch(paths.views.watch, views);
	gulp.watch(paths.styles.watch, styles);
	gulp.watch(paths.scripts.watch, scripts);
	gulp.watch(paths.images.watch, images);
	gulp.watch(paths.wasm.watch, wasm);
	//gulp.watch(paths.webp.watch, webpimages);
};
exports.clear = cleanFiles;
exports.views = views;
exports.styles = styles;
exports.scripts = scripts;
exports.wasm = wasm;
exports.images = images;
exports.favs = favs;
exports.server = server;

exports.default = production ? gulp.series(cleanFiles, data, fonts, gulp.parallel(views, styles, scripts, wasm, images, favs)) : 
gulp.series(cleanFiles, data, fonts, gulp.parallel( views, styles, scripts, wasm, images, favs), server);

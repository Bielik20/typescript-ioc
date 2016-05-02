var gulp = require('gulp');
var ts = require('gulp-typescript');
var merge = require('merge2');  
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var runSequence = require('run-sequence');
var del = require('del');
var rename = require('gulp-rename');
var jasmine = require('gulp-jasmine');
var jasmineBrowser = require('gulp-jasmine-browser');
var webpack = require('webpack-stream');

var tsProject = ts.createProject('tsconfig.json', { 
	sortOutput: true, 
	declaration: true,
	rootDir: "./src", 
	noExternalResolve: false
}, ts.reporter.fullReporter(true));

gulp.task('compile', function() {
	var tsResult = tsProject.src()
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(ts(tsProject, {referencedFrom:['typescript-ioc.ts']}));
 
	return merge([
		tsResult.dts.pipe(gulp.dest('release')),
		
		tsResult.js
				.pipe(sourcemaps.write('./')) 
				.pipe(gulp.dest('release'))
	]);
});


gulp.task('compile-min', function() {
	return tsResult = tsProject.src()
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(ts(tsProject, {referencedFrom:['typescript-ioc.ts']}))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(gulp.dest('release'));
});

gulp.task('clean', function() {
	return del(['release/**/*']);
});

gulp.task('test-compile', function(done) {
 	return tsResult = gulp.src('src/**/test.ts')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(ts(tsProject))
		.pipe(rename({ extname: '.spec.js' }))
		.pipe(sourcemaps.write('./')) 
		.pipe(gulp.dest('release'));
});

 
gulp.task('test-run', function() {
	return gulp.src('release/**/*.spec.js')
		.pipe(jasmine());
});

gulp.task('test-run-browser', function() {
  return gulp.src('release/**/*.spec.js')
	    .pipe(webpack({output: {filename: 'browser.spec.js'}}))
	    .pipe(jasmineBrowser.specRunner({console: true}))
	    //.pipe(jasmineBrowser.server({port: 8888})); // to test on real browsers, uncomment
	    .pipe(jasmineBrowser.headless());// to test on real browsers, comment 

});

gulp.task('test', function(done) {
    runSequence('test-compile', 'test-run', 'test-run-browser', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task('test-browser-only', function(done) {
    runSequence('test-compile', 'test-run-browser', function() {
        console.log('Release tested.');
        done();
    });
});

gulp.task('release', function(done) {
    runSequence('clean', 'compile', 'compile-min', 'test', function() {
        console.log('Release deployed.');
        done();
    });
});

gulp.task('watch', ['compile'], function() {
    gulp.watch('src/**/*.ts', ['compile']);
});
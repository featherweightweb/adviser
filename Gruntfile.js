/* global module, require */

module.exports = function(grunt) {

  var main_file = 'adviser.js';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        'predef': [
          'jQuery', 'window'
        ],
        'bitwise': true,
        'eqeqeq': true,
        'forin': true,
        'freeze': true,
        'maxdepth': 5,
        'noarg': true,
        'nonew': true,
        'singleGroups': true,
        'undef': true
      },
      main: {src: [main_file]}
    },

    uglify: {
      main: {
        files: {'adviser.min.js': [main_file]}
      }
    },

    watch: {
      grunt: {
        files: ['Gruntfile.js']
      },
      main: {
        files: ['*.js'],
        tasks: ['build']
      }
    }
  });
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.registerTask('build',
    ['jshint', 'uglify']);

  grunt.registerTask('default',
    ['build', 'watch']);
};
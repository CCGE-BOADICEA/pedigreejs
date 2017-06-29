module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: 'js/*.js',
        dest: 'dist/<%= pkg.name %>_<%= pkg.version %>.js',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'js/*.js',
        dest: 'dist/<%= pkg.name %>_<%= pkg.version %>.min.js'
      }
    },
    jshint: {
      ignore_warning: {
        options: {
          '-W015': true,
        },
        src: 'js/**',
        filter: 'isFile'
      }
    }
  });

  // Load the plugin that provides the "uglify" and "concat" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify']);
  grunt.registerTask('hint', ['jshint']);

};

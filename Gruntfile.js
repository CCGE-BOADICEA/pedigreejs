module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options : {
    	sourceMap :true
      },
      dist: {
        src: 'js/*.js',
        dest: 'dist/<%= pkg.name %>.js',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap : true,
        sourceMapIncludeSources : true,
        sourceMapIn : 'dist/<%= pkg.name %>.js.map'
      },
      build: {
    	src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
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

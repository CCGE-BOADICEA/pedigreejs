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
        dest: 'dist/js/<%= pkg.name %>.js',
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap : true,
        sourceMapIncludeSources : true,
        sourceMapIn : 'dist/js/<%= pkg.name %>.js.map'
      },
      build: {
    	src: '<%= concat.dist.dest %>',
        dest: 'dist/js/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      target: {
    	files: [{
    	  expand: true,
    	  src: ['css/*.css'],
    	  dest: 'dist',
    	  ext: '.min.css'
    	}]
      }
    },
    jshint: {
      ignore_warning: {
        options: {
          'loopfunc':true    // http://jshint.com/docs/options/#loopfunc
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
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
  grunt.registerTask('hint', ['jshint']);
};

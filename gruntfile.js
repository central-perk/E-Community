var path = require("path");

module.exports = function (grunt) {
  var assets = require("./assets.json");
  var cssRsPath = "." + assets["/public/stylesheets/index.min.css"];
  console.log("[autofix] in progress" + cssRsPath);
  grunt.initConfig({
    autoprefixer: {
      options: {
        browsers: ["chrome 30", "ff 30", "safari 7", "ie 9", "opera 20"],
      },
      single_file: {
        flatten: true,
        src: cssRsPath, // globbing is also possible here
        dest: cssRsPath,
      },
    },
  });

  grunt.loadNpmTasks("grunt-autoprefixer");

  grunt.registerTask("autofix", ["autoprefixer"]);
};

(function() {
  'use strict';
  angular.module('starter').controller('dataController', dataController)
  dataController.$inject = [
        '$ionicPlatform',
        'database',
        'movies'
    ];

  function dataController($ionicPlatform, database, movies) {
    var dataCtrl = this;
    $ionicPlatform.ready(function() {
      init()
    })

    function init() {
      database.init().then(function() {
        return fetchMoviesData()
      })
    }

    function fetchMoviesData() {
      movies.getWatchedMovies().then(function(result) {
        dataCtrl.watchedMovies = result
        return movies.getMoviesToWatch()
      }).then(function(result) {
        dataCtrl.toWatchMovies = result
      })
    }
    dataCtrl.saveMovieToDatabase = function(name) {
      movies.addMovieToDatabase(name).then(function() {
        fetchMoviesData()
      })
    }
    dataCtrl.markMoviesAsWatched = function(selectedMovies) {
      var movieList = []
      angular.forEach(selectedMovies, function(value, key) {
        if (value) {
          movieList.push(key)
        }
      })
      movies.markMoviesAsWatched(movieList).then(function() {
        fetchMoviesData()
      })
    }
  }
})();

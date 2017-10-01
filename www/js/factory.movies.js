(function() {
  'use strict';
  angular.module('starter').factory('movies', movies);
  movies.$inject = [
          'database'
      ];
  /* @ngInject */
  function movies(database) {
    var table = 'movies'
    var self = {
      getWatchedMovies: getWatchedMovies,
      getMoviesToWatch: getMoviesToWatch,
      markMoviesAsWatched: markMoviesAsWatched,
      addMovieToDatabase: addMovieToDatabase
    };
    return self;

    function getWatchedMovies() {
      return database.getBulkByColumn(table, 'is_watched', 'true', ['name', 'rowid'])
    }

    function getMoviesToWatch() {
      return database.getBulkByColumn(table, 'is_watched', 'false', ['name', 'rowid'])
    }

    function markMoviesAsWatched(movieList) {
      return database.updateBulk(table, 'rowid', movieList, ['is_watched'], ['true'])
    }

    function addMovieToDatabase(name) {
      return database.add(table, ['name', 'is_watched'], [name, 'false'])
    }
  }
})()

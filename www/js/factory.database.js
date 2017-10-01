(function() {
  'use strict';
  angular.module('starter').factory('database', database);
  database.$inject = [
        '$q'
    ];
  /* @ngInject */
  function database($q) {
    var DB_CONFIG = {
      name: 'app'
    };
    var dbRef = null;
    var self = {
      init: init,
      query: query,
      fetchMany: fetchMany,
      fetch: fetch,
      getAll: getAll,
      getById: getById,
      getBulkById: getBulkById,
      add: add,
      addBulk: addBulk,
      update: update,
      updateBulk: updateBulk,
      deleteById: deleteById,
      addOrUpdate: addOrUpdate,
      getByColumn: getByColumn,
      getBulkByColumn: getBulkByColumn,
      createTableIfNotExists: createTableIfNotExists
    };
    return self;

    function init() {
      if (!window.sqlitePlugin) {
        dbRef = createWebSqlDBRef()
      } else {
        dbRef = createSQLiteDBRef()
      }
      return initMovieTable()
    }

    function initMovieTable() {
      if (localStorage.getItem('_init_movies_table') !== 'true') {
        return createTableIfNotExists('movies', ['name NOT NULL', 'is_watched STRING true']).then(function() {
          return add('movies', ['name', 'is_watched'], ['The Shawshank Redemption', 'true'])
        }).then(function() {
          return add('movies', ['name', 'is_watched'], ['The Dark Knight Rises', 'false'])
        }).then(function() {
          return add('movies', ['name', 'is_watched'], ['The Dark Knight', 'false'])
        }).then(function() {
          localStorage.setItem('_init_movies_table', 'true')
          return $q.resolve()
        })
      } else {
        return $q.resolve()
      }
    }

    function createSQLiteDBRef() {
      return window.sqlitePlugin.openDatabase({
        name: DB_CONFIG.name,
        location: 'default',
      })
    }

    function createWebSqlDBRef() {
      return window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1)
    }

    function query(query, bindings) {
      bindings = typeof bindings !== 'undefined' ? bindings : [];
      var deferred = $q.defer();
      dbRef.transaction(function(transaction) {
        var transactionSuccess = function(transaction, result) {
          deferred.resolve(result);
        }
        var transactionFailure = function(transaction, error) {
          deferred.reject(error);
        }
        transaction.executeSql(query, bindings, transactionSuccess, transactionFailure);
      });
      return deferred.promise;
    };

    function createTableIfNotExists(name, columns) {
      var columns = columns.join(',');
      var statement = 'CREATE TABLE IF NOT EXISTS ' + name + '(' + columns + ')';
      return query(statement).then(function(result) {
        return fetch(result);
      });
    }

    function fetchMany(result) {
      var output = [];
      for (var i = 0; i < result.rows.length; i++) {
        var item = result.rows.item(i);
        for (var key in item) {
          item[key] = item[key];
        }
        output.push(item);
      }
      return output;
    };

    function fetch(result) {
      if (result.rows.length !== 0) {
        var item = result.rows.item(0);
        for (var key in item) {
          item[key] = item[key];
        }
        return item;
      } else {
        return [];
      }
    };

    function returnFromParams(columns, values) {
      var returnObj = {};
      for (var i = 0; i < columns.length; i++) {
        returnObj[columns[i]] = values[i];
      }
      return returnObj;
    }

    function returnManyFromParams(columns, valueArray) {
      var returnObjArr = [];
      for (var i = 0; i < valueArray.length; i++) {
        returnObjArr.push(returnFromParams(columns, valueArray[i]))
      }
      return returnObjArr;
    }

    function getById(table, id, columns) {
      var columns = columns.join(',');
      var statement = 'SELECT ' + columns + ' FROM ' + table + ' WHERE id = ?';
      return query(statement, [id]).then(function(result) {
        return fetch(result);
      });
    };

    function getBulkById(table, idList, columns) {
      var columns = columns.join(',');
      idList = idList.map(function(item) {
        return '"' + item + '"';
      })
      var statement = 'SELECT ' + columns + ' FROM ' + table + ' WHERE id IN(' + idList.join(', ') + ')';
      return query(statement).then(function(result) {
        return fetchMany(result)
      })
    };

    function getAll(table, columns, limit, orderBy, orderType) {
      var columns = columns.join(',');
      var statement = 'SELECT ' + columns + ' FROM ' + table;
      if (orderBy) {
        statement = statement + ' order by ' + orderBy + ' ' + orderType
      }
      if (limit) {
        statement = statement + ' limit ' + limit
      }
      return query(statement).then(function(result) {
        return fetchMany(result)
      })
    }

    function add(table, columns, values) {
      var valueString = values.map(function(item) {
        return '?';
      }).join(',');
      var statement = 'INSERT INTO ' + table + '(' + columns.join(',') + ') VALUES (' + valueString + ')';
      return query(statement, values).then(function(result) {
        return returnFromParams(columns, values);
      })
    }

    function addBulk(table, columns, valueArray) {
      var values = valueArray.map(function(item1) {
        item1 = item1.map(function(item2) {
          return '?';
        })
        return '(' + item1.join(',') + ')'
      }).join(',');
      var parameters = []
      for (var i = 0; i < valueArray.length; i++) {
        for (var j = 0; j < valueArray[i].length; j++) {
          parameters.push(valueArray[i][j])
        }
      }
      var statement = 'INSERT INTO ' + table + '(' + columns.join(',') + ') VALUES ' + values;
      return query(statement, parameters).then(function(result) {
        return returnManyFromParams(columns, valueArray);
      })
    }

    function update(table, columnName, columnValue, columns, values) {
      var colVals = columns.map(function(item, index) {
        return item + ' = ?';
      }).join(',');
      var statement = 'UPDATE ' + table + ' SET ' + colVals + ' WHERE ' + columnName + '=\'' + columnValue + '\'';
      return query(statement, values)
    }

    function updateBulk(table, columnName, columnValueArray, columns, values) {
      var colVals = columns.map(function(item, index) {
        return item + ' = ?';
      }).join(',');
      var columnValues = columnValueArray.join(',')
      var statement = 'UPDATE ' + table + ' SET ' + colVals + ' WHERE ' + columnName + ' in(' + columnValues + ')';
      return query(statement, values)
    }

    function deleteById(table, id) {
      var statement = 'Delete from ' + table + ' where id = ?';
      return query(statement, [id])
    }

    function addOrUpdate(table, id, columns, values) {
      return getById(table, id, ['*']).then(function(data) {
        if (Object.keys(data).length) {
          return update(table, id, columns, values)
        } else {
          columns.push('id')
          values.push(id)
          return add(table, columns, values)
        }
      })
    }

    function getByColumn(table, coulumnName, columnValue, columnsToFetch) {
      var columnsToFetch = columnsToFetch.join(',');
      var statement = 'SELECT ' + columnsToFetch + ' FROM ' + table + ' WHERE ' + coulumnName + ' = ?';
      return query(statement, [columnValue]).then(function(result) {
        return fetch(result);
      });
    }

    function getBulkByColumn(table, coulumnName, columnValue, columnsToFetch) {
      var columnsToFetch = columnsToFetch.join(',');
      var statement = 'SELECT ' + columnsToFetch + ' FROM ' + table + ' WHERE ' + coulumnName + ' = ?';
      return query(statement, [columnValue]).then(function(result) {
        return fetchMany(result);
      });
    }
  }
})();

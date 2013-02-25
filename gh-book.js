// Generated by CoffeeScript 1.3.3
(function() {
  var __slice = [].slice;

  define(['underscore', 'backbone', 'atc/controller', 'atc/models', 'epub/models', 'atc/auth', 'gh-book/views', 'css!atc'], function(_, Backbone, Controller, AtcModels, EpubModels, Auth, Views) {
    var DEBUG, b, defer, readDir, readFile, resetDesktop, uuid, writeFile;
    DEBUG = true;
    uuid = b = function(a) {
      if (a) {
        return (a ^ Math.random() * 16 >> a / 4).toString(16);
      } else {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
      }
    };
    defer = function(fn) {
      return function() {
        var args, callback, cb, deferred, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
        deferred = jQuery.Deferred();
        callback = function(err, value) {
          cb(err, value);
          if (err) {
            return deferred.reject(err, value);
          } else {
            return deferred.resolve(value);
          }
        };
        args.push(callback);
        fn.apply(this, args);
        return deferred.promise();
      };
    };
    writeFile = defer(function(path, text, commitText, cb) {
      return Auth.getRepo().write(Auth.get('branch'), "" + (Auth.get('rootPath')) + path, text, commitText, cb);
    });
    readFile = defer(function(path, cb) {
      return Auth.getRepo().read(Auth.get('branch'), "" + (Auth.get('rootPath')) + path, cb);
    });
    readDir = defer(function(path, cb) {
      return Auth.getRepo().contents(Auth.get('branch'), path, cb);
    });
    Backbone.sync = function(method, model, options) {
      var callback, error, id, path, success;
      success = options != null ? options.success : void 0;
      error = options != null ? options.error : void 0;
      callback = function(err, value) {
        if (err) {
          return typeof error === "function" ? error(model, err, options) : void 0;
        }
        return typeof success === "function" ? success(model, value, options) : void 0;
      };
      path = model.id || (typeof model.url === "function" ? model.url() : void 0) || model.url;
      if (DEBUG) {
        console.log(method, path);
      }
      switch (method) {
        case 'read':
          return readFile(path, callback);
        case 'update':
          return writeFile(path, model.serialize(), 'Editor Save', callback);
        case 'create':
          id = _uuid();
          model.set('id', id);
          return writeFile(path, model.serialize(), callback);
        default:
          throw "Model sync method not supported: " + method;
      }
    };
    AtcModels.SearchResults = AtcModels.SearchResults.extend({
      initialize: function() {
        var model, _i, _len, _ref,
          _this = this;
        _ref = AtcModels.ALL_CONTENT.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          model = _ref[_i];
          if (model.get('mediaType') !== 'text/x-module') {
            this.add(model, {
              at: 0
            });
          } else {
            this.add(model);
          }
        }
        AtcModels.ALL_CONTENT.on('reset', function() {
          return _this.reset();
        });
        AtcModels.ALL_CONTENT.on('add', function(model) {
          return _this.add(model);
        });
        return AtcModels.ALL_CONTENT.on('remove', function(model) {
          return _this.remove(model);
        });
      }
    });
    resetDesktop = function() {
      AtcModels.ALL_CONTENT.reset();
      EpubModels.EPUB_CONTAINER.reset();
      EpubModels.EPUB_CONTAINER._promise = null;
      return EpubModels.EPUB_CONTAINER.loaded().then(function() {
        EpubModels.EPUB_CONTAINER.each(function(book) {
          return book.loaded().then(function() {
            return console.log(book.id);
          });
        });
        if (!Backbone.History.started) {
          Controller.start();
        }
        return Backbone.history.navigate('workspace');
      });
    };
    Auth.on('change', function() {
      if (!_.isEmpty(_.pick(Auth.changed, 'repoUser', 'repoName', 'branch', 'rootPath'))) {
        return resetDesktop();
      }
    });
    return resetDesktop();
  });

}).call(this);
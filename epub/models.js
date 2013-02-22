// Generated by CoffeeScript 1.3.3
(function() {

  define(['exports', 'underscore', 'backbone', 'atc/media-types', 'atc/models', 'hbs!./opf-file', 'hbs!./container-file', 'hbs!./nav-serialize'], function(exports, _, Backbone, MEDIA_TYPES, AtcModels, OPF_TEMPLATE, CONTAINER_TEMPLATE, NAV_SERIALIZE) {
    var BaseBook, BaseCollection, BaseContent, EPUBContainer, HTMLFile, PackageFile, PackageFileMixin, TemplatedFileMixin, mixin;
    BaseCollection = AtcModels.DeferrableCollection;
    BaseContent = AtcModels.BaseContent;
    BaseBook = AtcModels.BaseBook;
    mixin = function(src, dest) {
      return _.defaults(dest, src);
    };
    TemplatedFileMixin = {
      getterField: function() {
        throw 'NO GETTER FIELD SET';
      },
      template: function() {
        throw 'NO TEMPLATE SET';
      },
      parse: function(xmlStr) {
        var ret;
        if ('string' === typeof xmlStr) {
          ret = {};
          ret[this.getterField] = xmlStr;
          return ret;
        } else {
          return xmlStr;
        }
      },
      serialize: function() {
        return this.template(this.toJSON());
      }
    };
    HTMLFile = BaseContent.extend(_.extend(TemplatedFileMixin, {
      mediaType: 'application/xhtml+xml',
      getterField: 'body',
      serialize: function() {
        return this.get(this.getterField);
      }
    }));
    PackageFileMixin = mixin(TemplatedFileMixin, {
      defaults: _.defaults(BaseBook.prototype.defaults, {
        language: 'en',
        title: null,
        creator: null,
        created: null,
        modified: null,
        publisher: null,
        copyrightDate: null
      }),
      getterField: 'content',
      mediaType: 'text/x-collection',
      template: OPF_TEMPLATE,
      manifestType: Backbone.Collection.extend({
        toJSON: function() {
          var model, _i, _len, _ref, _results;
          _ref = this.models;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            model = _ref[_i];
            _results.push(model.toJSON());
          }
          return _results;
        }
      }),
      initialize: function() {
        var promise,
          _this = this;
        BaseBook.prototype.initialize.apply(this, arguments);
        this.on('change:navTreeStr', function(model, navTreeStr) {
          var $body, $bodyNodes, $nav, $newTree, $wrap, bodyStr, newTree;
          $newTree = jQuery(_this.navModel.get('body'));
          newTree = NAV_SERIALIZE(JSON.parse(navTreeStr));
          $newTree = jQuery(newTree);
          $bodyNodes = jQuery(_this.navModel.get('body'));
          $body = jQuery('<div></div>').append($bodyNodes);
          $nav = $body.find('nav');
          if ($nav) {
            $nav.replaceWith($newTree);
          } else {
            $body.prepend($nav);
          }
          if ('html' === $body[0].tagName.toLowerCase()) {
            bodyStr = $body[0].outerHTML;
          } else {
            if ($body.length !== 1) {
              $wrap = jQuery('<div>/<div>');
              $wrap.append($body);
              $body = $wrap;
            }
            bodyStr = $body[0].innerHTML;
          }
          return _this.navModel.set('body', bodyStr);
        });
        promise = jQuery.Deferred();
        this.loaded().then(function() {
          return _this.navModel.loaded().then(function() {
            var navTree, recSetTitles;
            _this.navModel.on('change:body', function(model, xmlStr) {
              return _this._updateNavTreeFromXML(xmlStr);
            });
            navTree = _this._updateNavTreeFromXML(_this.navModel.get('body'));
            recSetTitles = function(nodes) {
              var model, node, _i, _len, _results;
              if (nodes == null) {
                nodes = [];
              }
              _results = [];
              for (_i = 0, _len = nodes.length; _i < _len; _i++) {
                node = nodes[_i];
                if (node.id) {
                  model = AtcModels.ALL_CONTENT.get(node.id);
                  model.set({
                    title: node.title
                  });
                }
                _results.push(recSetTitles(node.children));
              }
              return _results;
            };
            recSetTitles(navTree);
            return promise.resolve(_this);
          });
        });
        return this._promise = promise;
      },
      _updateNavTreeFromXML: function(xmlStr) {
        var $body, $nav, $xml, navTree;
        $xml = jQuery(xmlStr);
        if (!$xml[0]) {
          return this.trigger('error', 'Could not parse XML');
        }
        $body = jQuery('<div></div>').append($xml);
        $nav = $body.find('nav');
        if ($nav.length !== 1) {
          throw 'ERROR: Currently only 1 nav element in the navigation document is supported';
        }
        navTree = this.parseNavTree($nav).children;
        this.set('navTreeStr', JSON.stringify(navTree));
        return navTree;
      },
      parse: function(xmlStr) {
        var $xml, bookId, title,
          _this = this;
        if ('string' !== typeof xmlStr) {
          return xmlStr;
        }
        $xml = jQuery(jQuery.parseXML(xmlStr));
        if (!this.manifest) {
          this.manifest = new this.manifestType;
        }
        if (!$xml[0]) {
          return model.trigger('error', 'INVALID_OPF');
        }
        bookId = $xml.find("#" + ($xml.get('unique-identifier'))).text();
        title = $xml.find('title').text();
        $xml.find('package > manifest > item').each(function(i, item) {
          var $item, ContentType, mediaType, model;
          $item = jQuery(item);
          mediaType = $item.attr('media-type');
          ContentType = MEDIA_TYPES.get(mediaType).constructor;
          model = new ContentType({
            id: $item.attr('href'),
            properties: $item.attr('properties')
          });
          AtcModels.ALL_CONTENT.add(model);
          _this.manifest.add(model);
          if ('nav' === $item.attr('properties')) {
            return _this.navModel = model;
          }
        });
        return {
          title: title,
          bookId: bookId
        };
      },
      toJSON: function() {
        var json;
        json = BaseBook.prototype.toJSON.apply(this, arguments);
        json.manifest = this.manifest.toJSON();
        return json;
      }
    });
    PackageFile = BaseBook.extend(PackageFileMixin);
    EPUBContainer = BaseCollection.extend({
      template: CONTAINER_TEMPLATE,
      model: PackageFile,
      defaults: {
        urlRoot: ''
      },
      url: function() {
        return 'META-INF/container.xml';
      },
      toJSON: function() {
        var model, _i, _len, _ref, _results;
        _ref = this.models;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          model = _ref[_i];
          _results.push(model.toJSON());
        }
        return _results;
      },
      parse: function(xmlStr) {
        var $xml, ret,
          _this = this;
        $xml = jQuery(xmlStr);
        ret = [];
        $xml.find('rootfiles > rootfile').each(function(i, el) {
          var href;
          href = jQuery(el).attr('full-path');
          return ret.push({
            id: href,
            title: 'Loading Book Title...'
          });
        });
        return ret;
      }
    });
    MEDIA_TYPES.add('application/xhtml+xml', {
      constructor: HTMLFile,
      editAction: MEDIA_TYPES.get('text/x-module').editAction
    });
    exports.EPUB_CONTAINER = new EPUBContainer();
    return exports;
  });

}).call(this);

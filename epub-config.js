// Generated by CoffeeScript 1.3.3
(function() {
  var ALOHA_PATH;

  require.onError = function(err) {
    return console.error(err);
  };

  ALOHA_PATH = '../Aloha-Editor';

  require.config({
    paths: {
      aloha: ALOHA_PATH + '/src/lib/aloha',
      'template/helpers/identstring': 'epub/hbs-helper-identstring'
    }
  });

}).call(this);

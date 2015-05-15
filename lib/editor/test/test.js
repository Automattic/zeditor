
var Editor = require('../');
var assert = require('assert');

describe('Cloudup Editor', function () {
  var div;

  afterEach(function () {
    if (div) {
      // clean up...
      document.body.removeChild(div);
      div = null;
    }
  });

  describe('new Editor(HTMLElement)', function () {

    it('should create an `Editor` instance with `new` keyword', function () {
      div = document.createElement('div');
      document.body.appendChild(div);

      var editor = new Editor(div);
      assert(editor instanceof Editor);
      assert(div === editor.wrapper);
    });

    it('should create an `Editor` instance without `new` keyword', function () {
      div = document.createElement('div');
      document.body.appendChild(div);

      var editor = Editor(div);
      assert(editor instanceof Editor);
      assert(div === editor.wrapper);
    });

  });

  describe('Editor#serializer.serializeRoot()', function () {

    it('should output the serialized content', function () {
      div = document.createElement('div');
      document.body.appendChild(div);
      div.innerHTML = '<p>foo</p><p>bar</p><p>baz</p>';

      var editor = Editor(div);
      assert.equal('<p>foo</p><p>bar</p><p>baz</p>', editor.serializer.serializeRoot());
    });

  });

});


var is = require('../');
var assert = require('assert');

describe('is', function () {

  describe('text()', function () {

    it('should return `true` for a TextNode', function () {
      assert.equal(true, is.text(document.createTextNode('')));
    });

    it('should return `false` for an HTML Element', function () {
      assert.equal(false, is.text(document.createElement('div')));
    });

  });

  describe('element()', function () {

    it('should return `true` for an HTML Element', function () {
      assert.equal(true, is.element(document.createElement('div')));
    });

    it('should return `false` for a TextNode', function () {
      assert.equal(false, is.element(document.createTextNode('')));
    });

  });

  describe('p()', function () {

    it('should return `true` for a P node', function () {
      assert.equal(true, is.p(document.createElement('p')));
    });

    it('should return `false` for B node', function () {
      assert.equal(false, is.p(document.createElement('b')));
    });

  });

  describe('list()', function () {

    it('should return `true` for a UL node', function () {
      assert.equal(true, is.list(document.createElement('ul')));
    });

    it('should return `true` for an OL node', function () {
      assert.equal(true, is.list(document.createElement('ol')));
    });

    it('should return `false` for P node', function () {
      assert.equal(false, is.list(document.createElement('p')));
    });

  });

  describe('listItem()', function () {

    it('should return `true` for a LI node', function () {
      assert.equal(true, is.listItem(document.createElement('li')));
    });

    it('should return `false` for a UL node', function () {
      assert.equal(false, is.listItem(document.createElement('ul')));
    });

  });

  describe('emptyListItem()', function () {

    it('should return `true` for a LI node with a BR', function () {
      var li = document.createElement('li');
      li.innerHTML = '<br>';
      assert.equal(true, is.emptyListItem(li));
    });

    it('should return `false` for a LI with text', function () {
      var li = document.createElement('li');
      li.innerHTML = 'foo';
      assert.equal(false, is.emptyListItem(li));
    });

  });

});

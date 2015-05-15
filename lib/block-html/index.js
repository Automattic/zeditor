/**
 * Module Dependencies
 */

var domify = require('domify');
var query = require('component-query');
var inserted = require('inserted');
var inherits = require('inherits');

var Block = require('../block');

var el = domify(require('./html-block')());

/**
 * Represents a Block Holding arbitrary HTML content
 */

function HTMLBlock(node) {
  if (!(this instanceof HTMLBlock)) return new HTMLBlock(node);

  Block.call(this, el.cloneNode(true));

  this.body = query('.body', this.overlay);
  this.node = node;

  inserted(this.overlay, onInserted.bind(this));
}

inherits(HTMLBlock, Block);

/**
 * Called whenever we're inserted into the DOM
 */

function onInserted() {
  this.body.appendChild(this.node);
}

/**
 * Serializes the raw HTML inside the block
 */

HTMLBlock.prototype.serialize = function (context) {
  return this.node;
}

/**
 * Exports
 */

module.exports = HTMLBlock;

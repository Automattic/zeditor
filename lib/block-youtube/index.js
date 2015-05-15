
/**
 * Module dependencies
 */

var domify = require('domify');
var Block = require('../block');
var inherits = require('inherits');

/**
 * Template
 */

var el = require('./youtube');

/**
 * Expose `Youtube`
 */

module.exports = Youtube;

/**
 * Initialize `youtube`
 */

function Youtube(id){
  if (!(this instanceof Youtube)) return new Youtube(id);

  this.videoId = id;

  // initialize the block
  Block.call(this, domify(el({ id: id })));
}

inherits(Youtube, Block);

Youtube.prototype.serialize = function(){
  var wrapper = document.createElement('p');
  var shortcode = '[youtube=https://www.youtube.com/watch?v=' + this.videoId + ']';
  var content = document.createTextNode(shortcode);
  wrapper.appendChild(content);
  return wrapper;
};

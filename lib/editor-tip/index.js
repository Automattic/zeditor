
/**
 * Module dependencies.
 */

var Tip = require('component-tip');
var inherits = require('inherits');
var clickOutside = require('click-outside');
var debug = require('debug')('editor:editor-tip');

/**
 * Module exports.
 */

module.exports = EditorTip;

/**
 * Editor's `Tip` extends the `component/tip` module.
 *
 * Our version implements the "click outside" logic to hide the Tip when the user
 * clicks outside.
 *
 * @param {String} html - HTML string to render inside of the Tip
 * @param {String} classname - the CSS classname to use for the Tip
 * @public
 */

function EditorTip (html, classname) {
  if (!(this instanceof EditorTip)) return new EditorTip(html);
  Tip.call(this, html);

  // this value defined in `editor-tip.styl` CSS
  this.pad = 25;

  this.classname = classname || 'editor-tip';

  // not sure why the main Tip doesn't keep track of this…
  this.shown = false;

  this.unbindClickOutside = null;
  this.clickOutside = this.clickOutside.bind(this);
}

/**
 * Inherits from `Tip`.
 */

inherits(EditorTip, Tip);

/**
 * Shows the tooltip on the given `el` DOM element.
 * Adds the "click outside" watcher.
 *
 * @param {Node|Range} el - DOM element to make the tip point to
 * @public
 */

EditorTip.prototype.show = function (el) {
  if (this.shown && el === this.target) return;

  debug('showing tooltip');
  var r =  Tip.prototype.show.apply(this, arguments);

  this.shown = true;
  return r;
};

/**
 * Hides the tooltip.
 * Uninstalls the "click outside" handler.
 *
 * @public
 */

EditorTip.prototype.hide = function () {
  if (!this.shown) return;

  debug('hiding tooltip');
  var r = Tip.prototype.hide.apply(this, arguments);

  if (this.unbindClickOutside) {
    debug('invoking unbindClickOutside()');
    this.unbindClickOutside();
    this.unbindClickOutside = null;
  }

  this.shown = false;
  return r;
};

/**
 * Toggles the hide/shown state of the Tip.
 *
 * @param {DOMElement} element - the element to have the tip "target" upon show
 * @public
 */

EditorTip.prototype.toggle = function (element) {
  debug('toggling state of tooltip');
  if (this.shown) {
    return this.hide();
  } else {
    return this.show(element);
  }
};

/**
 * Adds the "click outside" watch handler to hide the Tooltip upon
 * clicks outside the `.inner` <div> on the tooltip.
 *
 * @public
 */

EditorTip.prototype.addClickOutside = function () {
  debug('addClickOutside()');
  if (this.unbindClickOutside) {
    debug('invoking unbindClickOutside()');
    this.unbindClickOutside();
  }
  this.unbindClickOutside = clickOutside(this.el, this.clickOutside);
};

/**
 * "click outside" callback function. Hides the tooltip.
 *
 * @private
 */

EditorTip.prototype.clickOutside = function () {
  debug('click outside tooltip');
  this.hide();
};

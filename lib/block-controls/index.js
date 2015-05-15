
/**
 * Module dependencies
 */

var classes = require('component-classes');
var empty = require('component-empty');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('editor:block-controls');
var dataset = require('dataset');

/**
 * Expose `BlockControls` module
 */

module.exports = BlockControls;

/**
 * Gallery block controls
 *
 * @api public
 */

function BlockControls(className){
  EventEmitter.call(this);
  this.el = document.createElement('div');
  this.el.className = 'controls ' + (className || '');
  this.el.addEventListener('click', this.onactive.bind(this), false);
}

/**
 * Inherit from `EventEmitter`
 */

inherits(BlockControls, EventEmitter);

/**
 * Reset layout
 */

BlockControls.prototype.reset = function(){
  empty(this.el);
};

/**
 * Add action button
 *
 * @param {String} action description
 * @param {Boolean} [active]
 * @param {Boolean} [selectable]
 * @api public
 */

BlockControls.prototype.add = function(action, active, selectable){
  active = !!active;
  selectable = false !== selectable;

  debug('add %o button. active: %o. selectable: %o', action, active, selectable);

  var a;
  if (typeof action == 'string') {
    a = document.createElement('a');
    dataset(a, 'action', action);
    a.className = 'control ';
    a.className += (selectable ? 'selectable ' : ' ' ) + (active ? 'current-action' : '');
  } else {
    a = action;
  }

  this.el.appendChild(a);
};

/**
 * Add action buttons to control
 *
 * @param {Array} actions
 * @param {Number} [active]
 * @api public
 */

BlockControls.prototype.actions = function(actions, active){
  active = active || 0;
  for (var i = 0; i < actions.length; i++) {
    this.add(actions[i], i == active);
  }
};

/**
 * Set `active` admin element
 *
 * @param {String} action
 * @api public
 */

BlockControls.prototype.set = function(action){
  var el = this.getElementByAction(action);
  if (el) {
    debug('set %o action', action);
    this.setCurrentAction(el);

    debug('emit %o action event', action);
    this.emit(action);
  }
};

/**
 * Set `current` action
 *
 * @param {Object} el
 * @api private
 */

BlockControls.prototype.setCurrentAction = function(el){
  if (!classes(el).has('selectable')) return;

  var els = el.parentNode.getElementsByClassName('control');
  for (var i = 0; i < els.length; i++) {
    classes(els[i]).remove('current-action');
  }
  classes(el).add('current-action');
};

/**
 * Get element by `data-action` value
 *
 * @param {String} v
 * @api private
 */

BlockControls.prototype.getElementByAction = function(v){
  var el;
  var els = this.el.getElementsByClassName('control');

  for (var i = 0; i < els.length; i++) {
    if (els[i] && dataset(els[i], 'action') == v) {
      el = els[i];
      continue;
    }
  }
  return el;
};

/**
 * Bind `click` event
 *
 * @param {Object} e
 * @api private
 */

BlockControls.prototype.onactive = function(e){
  if (classes(e.target).has('control')) {
    var action = dataset(e.target, 'action');
    this.set(action);
  }
};

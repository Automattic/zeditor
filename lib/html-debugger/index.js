/**
 * Module dependencies
 */

var store = require('store');
var domify = require('domify');
var classes = require('component-classes');
var pretty = require('pretty-html');
var currentRange = require('current-range');

/**
 * Singleton
 */

var htmldebugger;

/**
 * Export `Debugger`
 */

module.exports = function(editor){
  if (htmldebugger) {
    htmldebugger.el.parentNode.removeChild(htmldebugger.el);
  }

  htmldebugger = new Debugger(editor);
  return htmldebugger;
};

/**
 * Pane
 */

var pane = domify('<div class="html-debugger hidden"></div>');

/**
 * Initialize `Debugger`
 */

function Debugger(editor){
  if (!(this instanceof Debugger)) return new Debugger(editor);
  var el = this.el = pane.cloneNode(true);
  this.classes = classes(el);
  this.editor = editor;
  el.innerHTML = pretty(editor.el, currentRange(editor.el)).html();
  if (store.get('debug:htmlpane')) this.toggle();
}

/**
 * update
 */

Debugger.prototype.update = function() {
  if (this.classes.has('hidden')) {
    return;
  }
  this.el.innerHTML = pretty(this.editor.el, currentRange(this.editor.el)).html();
  this.el.scrollTop = this.el.scrollHeight;
};

/**
 * toggle
 */

Debugger.prototype.toggle = function(){
  if (this.classes.has('hidden')) {
    store.set('debug:htmlpane', true);
    this.classes.remove('hidden');
    this.update();
  } else {
    store.set('debug:htmlpane', false);
    this.classes.add('hidden');
  }
};

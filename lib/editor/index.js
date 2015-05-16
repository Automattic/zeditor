
/*!
 * Module dependencies.
 */

var plugin = require('zeditor-plugin');

/*!
 * Export `Zeditor`.
 */

module.exports = plugin(Zeditor);

var ZeditorNormalizer = require('zeditor-normalizer');

var domify = require('domify');
var os = require('component-os');
var uid = require('component-uid');
var contains = require('node-contains');
var classes = require('component-classes');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var DomIterator = require('dom-iterator');
var events = require('component-events');
var query = require('component-query');
var empty = require('component-empty');
var currentSelection = require('current-selection');
var currentRange = require('current-range');
var selectionSetRange = require('selection-set-range');
var Drag = require('drag-element');
var BlockquoteCommand = require('blockquote-command');
var LinkCommand = require('link-command');
var ListCommand = require('list-command');
var HeaderCommand = require('header-command');
var NativeCommand = require('native-command');
var WrapCommand = require('wrap-command');
var PaddingCommand = require('padding-command');
var MutationObserver = require('mutation-observer');
var mousetrap = require('coreh-mousetrap');
var HashMap = require('hashmap');
var dataset = require('dataset');
var deprecate = require('util-deprecate');
var debug = require('debug')('editor:editor');
var collapse = require('collapse');
var loadStyles = require('load-styles');
var defaults = require( 'lodash.defaults' );

/*!
 * Internal dependencies.
 */

var is = require('../is');
var Block = require('../block');
var overlay = require('../editor-overlay');
var input = require('../input-normalizer/index');
var Serializer = require('../editor-serializer');
var transactions = require('../transaction-manager');
var fonts = require('../font-loader');
var Tokenizer = require('../tokenizer');
var EditorTip = require('../editor-tip');
var AutoScroll = require('../auto-scroll');
var CodeCommand = require('../block-code/command');

var tokenizerLinks = require('../tokenizer-links');

var EditorKeyboardShortcuts = require('../editor-keyboard-shortcuts');
var EditorToolbar = require('../editor-toolbar');
var EditorToolbarTooltips = require('../editor-toolbar-tooltips');
var EditorLinkTooltip = require('../editor-link-tooltip');
var EditorSelection = require('../editor-selection');

/*!
 * Templates.
 */

var tpl = {
  formatbar: require('./formatbar'),
  formatbarHeader: require('./formatbar-header'),
  formatbarJustify: require('./formatbar-justify')
};

/*!
 * The "join hint" is placed before/after "blocks" to indicate that, if/when the
 * block gets moved, then the join hints will be joined back into the same text
 * node, rather than remain disjointed <p> tags on their own lines.
 */

var joinHint = domify('<span class="join-hint" contenteditable="false"></span>');

/**
 * Creates and returns a new `Zeditor` instance with the given `wrapper` DOM
 * element. 
 * *
 * @param {Element} wrapper
 * @param {Object} [options] - optional
 * @return {Zeditor}
 * @class
 * @public
 */

function Zeditor(wrapper, options) {

  EventEmitter.call(this);
  this.setMaxListeners(Infinity);

  if (!options) {
    options = {};
  }
  defaults(options, {tipClassname: 'editor-tip'});

  this.id = uid(3);

  this.wrapper = wrapper;
  classes(this.wrapper)
    .add('automattic-editor-wrapper')
    .add('automattic-editor-' + this.id);

  // wrap editor contents
  this.el = document.createElement('div');
  this.el.contentEditable = true;
  while (this.wrapper.firstChild) {
    this.el.appendChild(this.wrapper.firstChild);
  }
  this.wrapper.appendChild(this.el);

  this.tipClassname = options.tipClassname;

  // add mousetrap instance
  this.mousetrap = mousetrap();

  // by default mousetrap does not fire on content editable.
  // this overrides this default behavior to make it fire.
  // in fact we restrict shortcuts to only work inside the editor.
  this.mousetrap.stopCallback = this.mousetrapStopCallback.bind(this);

  // add publish params object
  this.publishParams = new HashMap();

  // set pending tasks
  this.tasks = 0;

  // events handler
  this.ev = events(this.el, this);
  this.ev.bind('mousemove', 'onmousemove');
  this.ev.bind('blur', 'checkEmpty');

  // css classes handler
  this.classes = classes(this.el, this);
  this.classes.add('editor');

  this.drag = new Drag(this.el);
  this.drag.on('start', this.ondragstart.bind(this));
  this.drag.on('commit', this.ondragcommit.bind(this));
  this.drag.on('cancel', this.ondragcancel.bind(this));

  this.serializer = new Serializer(this);

  this.overlay = overlay(this);
  this.tokens = new Tokenizer(this);
  this.input = input(this);
  this.transactions = transactions(this.el);
  this.transactions.on('contentchange', this.oncontentchange.bind(this));

  this.autoscroll = new AutoScroll(this);

  // font preloading
  this.fonts = fonts();
  this.wrapper.appendChild(this.fonts.el);
  this.fonts.load('merriweather', 300, 'normal');
  this.fonts.load('merriweather', 700, 'normal');
  this.fonts.load('merriweather', 300, 'italic');
  this.fonts.load('merriweather', 700, 'italic');

  this.commands = {
    h1: new HeaderCommand(1),
    h2: new HeaderCommand(2),
    h3: new HeaderCommand(3),
    h4: new HeaderCommand(4),
    h5: new HeaderCommand(5),
    h6: new HeaderCommand(6),

    bold: new WrapCommand('strong'),
    italic: new WrapCommand('em'),
    underline: new WrapCommand('u'),
    strikethrough: new WrapCommand('del'),
    code: new CodeCommand(this),

    justifyleft: new NativeCommand('justifyleft'),
    justifycenter: new NativeCommand('justifycenter'),
    justifyright: new NativeCommand('justifyright'),
    justifyfull: new NativeCommand('justifyfull'),

    insertOrderedList: new ListCommand('ol'),
    insertUnorderedList: new ListCommand('ul'),

    indent: new PaddingCommand({ delta: 30, max: 300 }, this.el),
    outdent: new PaddingCommand({ delta: -30, max: 300 }, this.el),

    blockquote: new BlockquoteCommand(),

    link: new LinkCommand(),

    undo: this.transactions.undoCommand,
    redo: this.transactions.redoCommand
  };

  // window events
  window.addEventListener('resize', this.onresize.bind(this));
  window.addEventListener('mouseup', this.onmouseup.bind(this));

  // hook up the "selectionchange" event
  this.selection = null;
  this.backward = false;
  this.use(EditorSelection());
  this.on('selectionchange', this.onselectionchange.bind(this));

  // initialize default Zeditor plugins
  this.use(EditorKeyboardShortcuts({
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+1': 'h1',
    'mod+2': 'h2',
    'mod+3': 'h3',
    'mod+4': 'h4',
    'mod+5': 'h5',
    'mod+6': 'h6',
    'mod+k': 'link',
    'mod+[': 'outdent',
    'mod+]': 'indent',
    'mod+z': 'undo',
    'mod+shift+z': 'redo',
    'alt+shift+d': 'strikethrough',
    'alt+shift+l': 'justifyleft',
    'alt+shift+j': 'justifyfull',
    'alt+shift+c': 'justifycenter',
    'alt+shift+r': 'justifyright',
    'alt+shift+u': 'insertUnorderedList',
    'alt+shift+o': 'insertOrderedList',
    'alt+shift+q': 'blockquote',
    'alt+shift+x': 'code',
  }));

  // setup the "formatbar"
  var commandKeys = {
    command: 'mac' == os ? '⌘' : 'Ctrl+',
    altShift: 'mac' == os ? '⌥⇧' : 'Alt+Shift+'
  };
  this.formatbar = domify(tpl.formatbar(commandKeys));
  // insert before the `.editor` div
  this.wrapper.insertBefore(this.formatbar, this.el);
  this.wrapper.insertBefore(this.overlay.el, this.el);
  this.wrapper.insertBefore(this.tokens.renderer.el, this.el);
  this.wrapper.insertBefore(this.drag.display, this.el);

  this.use(EditorToolbar(this.formatbar));
  this.use(tokenizerLinks());

  var formatbarHeader = query('.format-header', this.formatbar);
  this.use(EditorToolbarTooltips(tpl.formatbarHeader(commandKeys), formatbarHeader));

  // alignment tooltip
  var formatbarJustify = query('.justify', this.formatbar);
  this.use(EditorToolbarTooltips(tpl.formatbarJustify(commandKeys), formatbarJustify));

  // "view/edit link" inline tooltip
  this.use(EditorLinkTooltip());

  // Debugging tools
  this.htmldebugger = require('../html-debugger')(this);
  document.body.appendChild(this.htmldebugger.el);
  this.mousetrap.bind('mod+d', this.showDebugger.bind(this));

  this.checkEmpty();
}

/*!
 * Mixin `Emitter`
 */

inherits(Zeditor, EventEmitter);

/**
 * Set editor's "placeholder" value, to display when there's no content.
 *
 * @param {String} placeholder
 * @public
 */

Zeditor.prototype.placeholder = function(placeholder) {
  debug('setting editor "placeholder": %o', placeholder);
  dataset(this.el, 'placeholder', placeholder);
};

/**
 * Focus editor helper function.
 *
 * @public
 */

Zeditor.prototype.focus = function() {
  this.emit('focus');
  this.el.focus();
};


/**
 * Get publish param.
 *
 * @param {String} k
 * @deprecated
 */

Zeditor.prototype.getParam = deprecate(function (k){
  return this.publishParams.get(k);
}, 'use `editor.publishParams.get()` instead');

/**
 * Set publish param.
 *
 * @param {String} k
 * @param {String|Array|Object|Number} v
 * @deprecated
 */

Zeditor.prototype.setParam = deprecate(function(k, v){
  return this.publishParams.set(k, v);
}, 'use `editor.publishParams.set()` instead');


/**
 * Insert a block
 *
 * @param {Element} el
 * @return {Zeditor}
 * @private
 */

Zeditor.prototype.block = function(el) {
  // TODO: re-add string arg support when API is better defined
  // if ('string' == typeof el) el = Block(el, this).el;

  // allow passing block instances directly
  if (el instanceof Block) {
    el.bind(this);
    el = el.el;
  }

  this.el.focus();

  var sel = currentSelection(this.el);
  var node = sel.focusNode;

  // ascend in node hierarchy
  while (node && node.parentNode != this.el) {
    node = node.parentNode;
  }

  if (!node) {
    node = this.el.firstChild;
  }

  this.transactions.run(function() {
    if (is.emptyParagraph(node)) {
      this.el.insertBefore(el, node);
      this.el.removeChild(node);
    } else {
      this.el.insertBefore(el, node.nextSibling);
    }
    var range = document.createRange();
    range.selectNodeContents(el);
    selectionSetRange(sel, range);
    collapse.toStart(sel);
  }.bind(this));

  return this;
};

/**
 * React to window resize
 *
 * @return {Zeditor}
 * @private
 */

Zeditor.prototype.onresize = function() {
  this.overlay.update();
};

/**
 * React to mouse up on window
 *
 * @private
 */

Zeditor.prototype.onmousemove = function(e) {
  this.drag.update(e.target, e.clientX, e.clientY);
  this.autoscroll.target(e.clientX, e.clientY);
};

/**
 * React to mouse up on window
 *
 * @private
 */

Zeditor.prototype.onmouseup = function() {
  this.drag.commit();
};

/**
 * Make sure the selection is contained on one of the
 * child nodes of the editor, and not on the editor
 * element itself.
 *
 * @private
 */

Zeditor.prototype.normalizeSelection = function() {
  // Make sure selection Range is always inside one of the paragraphs
  var selection = currentSelection(this.el);
  var range = currentRange(selection);
  if (!range) {
    return;
  }
  if (!this.el.firstChild) {
    return;
  }
  var newRange;
  if (range.startContainer == this.el) {
    newRange = range.cloneRange();
    if (range.startOffset == this.el.childNodes.length) {
      newRange.setStart(this.el.lastChild, this.el.lastChild.childNodes.length);
    } else {
      newRange.setStart(this.el.childNodes[range.startOffset], 0);
    }
  }
  if (range.endContainer == this.el) {
    newRange = newRange || range.cloneRange();
    if (range.endOffset == this.el.childNodes.length) {
      newRange.setEnd(this.el.lastChild, this.el.lastChild.childNodes.length);
    } else {
      newRange.setEnd(this.el.childNodes[range.endOffset], 0);
    }
  }
  if (newRange) {
    selectionSetRange(selection, newRange, false);
  }
}

/**
 * React to the Zeditor instance's "selectionchange" event.
 *
 * @private
 */

Zeditor.prototype.onselectionchange = function() {
  this.normalizeSelection();
  this.overlay.updateSelection();
  this.htmldebugger.update();
};

/**
 * TransactionManager "contentchange" event handler.
 *
 * @private
 */

Zeditor.prototype.oncontentchange = function() {
  this.checkEmpty();
  this.normalizeSelection();
  this.emit('contentchange');
  this.htmldebugger.update();
};

/**
 * Execute command `name` on the editor. If the specified command requires
 * a value to be passed in then `val` second parameter may be used.
 *
 *   editor.execute('bold');
 *   editor.execute('underline');
 *
 * @param {String} name
 * @param {Mixed} val
 * @public
 */

Zeditor.prototype.execute = function(name, val) {
  debug('execute(%o, %o)', name, val);
  var command = this.commands[name];
  if (!command) {
    throw new TypeError('command name "' + name + '" was not defined in `commands` Object');
  }
  this.focus();
  command.execute(val);
  this.emit('execute', name, val);
  return this;
};

/**
 * Add a plugin to the editor
 *
 * @param {Function} fn
 * @return {Zeditor}
 */

Zeditor.prototype.use = function(fn) {
  fn(this);
  return this;
};

/**
 * showDebugger
 *
 * @param {Event} e
 * @return {Zeditor}
 * @private
 */

Zeditor.prototype.showDebugger = function(e) {
  e.preventDefault();
  this.htmldebugger.toggle();
};

/**
 * returns `true` if there's no "content" inside the Zeditor, `false` otherwise
 *
 * @return {Boolean}
 * @public
 */

Zeditor.prototype.isEmpty = function() {
  // fast check: if there's < 2 childNodes in Zeditor, then it's potentially empty
  var empty = this.el.childNodes.length < 2;

  if (empty) {
    // these elements produce visual markers in the editor, and therefore
    // should be considered as "non-empty" when found within the article
    var next;
    var blacklist = {
      'BLOCKQUOTE': true,
      'CODE': true,
      'IMG': true,
      'OL': true,
      'UL': true,
    };

    // if we're still empty at this point then go for the DOM iterator
    // approach, and determine if there is *any* content within the editor
    var iterator = new DomIterator(this.el)
      .revisit(false)
      .select(3 /* Node.TEXT_NODE */)
      .select(function (node) {
        // check the list of blacklisted nodes, since they
        // add visual markers that overlay the placeholder text
        return blacklist[node.nodeName];
      })
      .select(function (node) {
        // also blacklist "overlay-reference" DIVs, since those
        // are an embed/shortcode
        return node.className === 'overlay-reference';
      });

    while (next = iterator.next()) {
      if (!contains(this.el, next)) break;
      if (1 === next.nodeType /* Node.ELEMENT_NODE */) {
        debug('found %o node, marking as "non-empty"', next.nodeName);
        empty = false;
        break;
      }
      // assume it's a Text node
      var v = next.nodeValue;
      if (v.length > 0 && !(v.length === 1 && v === '\u200B')) {
        debug('found non-empty TextNode, marking as "non-empty"');
        empty = false;
        break;
      }
    }
  }

  debug('is empty? %o', empty);
  return empty;
};

/**
 * checkEmpty
 *
 * @private
 */

Zeditor.prototype.checkEmpty = function() {
  debug('checkEmpty()');

  if (this.isEmpty()) {
    this.classes.add('show-placeholder');
  } else {
    this.classes.remove('show-placeholder');
  }
};

/**
 * Fired when the drag operation starts
 *
 * @private
 */

Zeditor.prototype.ondragstart = function(el) {
  if (is.element(el) && classes(el).has('overlay-reference')) {
    var overlay = this.overlay.for(el);
    classes(overlay).add('dragging');
  }
  this.autoscroll.start();
};

/**
 * Fired when the drag operation is commited
 *
 * @private
 */

Zeditor.prototype.ondragcommit = function(el, split) {
  if (is.element(el) && classes(el).has('overlay-reference')) {
    var overlay = this.overlay.for(el);
    classes(overlay).remove('dragging');

    if (split) {
      // add join hint span elements for joining
      if (el.previousSibling) {
        el.previousSibling.appendChild(joinHint.cloneNode(true));
      }
      if (el.nextSibling) {
        if (el.nextSibling.childNodes.length > 0) {
          el.nextSibling.insertBefore(joinHint.cloneNode(true), el.nextSibling.firstChild);
        } else {
          el.nextSibling.appendChild(joinHint.cloneNode(true));
        }
      }
    }
  }
  this.autoscroll.stop();
};

/**
 * Fired when the drag operation is cancelled
 *
 * @private
 */

Zeditor.prototype.ondragcancel = function(el) {
  if (is.element(el) && classes(el).has('overlay-reference')) {
    var overlay = this.overlay.for(el);
    classes(overlay).remove('dragging');
  }
  this.autoscroll.stop();
};

/**
 * By default, `mousetrap` does not fire on "contenteditable".
 *
 * This overrides this default behavior to make it fire.
 * In fact, we restrict shortcuts to *only* work inside the editor.
 *
 * @private
 */

Zeditor.prototype.mousetrapStopCallback = function (e, element) {
  while (element) {
    if (element == this.el) {
      return false;
    }
    element = element.parentNode;
  }
  return true;
};

/**
 * Increment pending tasks
 *
 * @param {Number} [n]
 * @api public
 */

Zeditor.prototype.incrementTasks = function(n){
  n = n || 1;
  this.tasks += n;
  debug('Incremented %o tasks: %o', n, this.tasks);
};

/**
 * Decrement pending tasks
 *
 * @param {Number} [n]
 * @api public
 */

Zeditor.prototype.decrementTasks = function(n){
  n = n || 1;
  this.tasks -= n;
  debug('Decremented %o tasks: %o', n, this.tasks);

  if (!this.tasks) {
    debug('zero tasks');
    this.emit('tasks done');
  }
};

/**
 * Adds the given CSS string to the `<head>` of the Zeditor's document node.
 *
 * The CSS is may be scoped to the "Zeditor" instance by using the `::editor`
 * pseudo-selector. For example, so select all the STRONG tags within the
 * editor, you would use `::editor strong` as the CSS selector.
 *
 * Useful for editor plugins.
 *
 * @param {String} styles - CSS string rules
 * @public
 */

Zeditor.prototype.addStyles = function (styles) {
  // replace "::editor" psuedo-selectors
  var replacement = '.automattic-editor-' + this.id;
  var replaced = styles.replace(/\:\:editor/g, replacement);

  var styleNode =  loadStyles(replaced);

  classes(styleNode)
    .add('automattic-editor-styles')
    .add('automattic-editor-styles-' + this.id);

  return styleNode;
};

/**
 * Creates and returns a new "Zeditor Tip" instance with the given HTML string.
 *
 * Useful for editor plugins.
 *
 * @param {String} html - HTML string for the Tip contents
 * @return {EditorTip}
 * @public
 */

Zeditor.prototype.tip = function (html) {
  return new EditorTip(html, this.tipClassname);
};


/**
 * Module dependencies
 */

var dataset = require('dataset');
var throttle = require('per-frame');
var classes = require('component-classes');
var events = require('component-events');
var cssTransform = require('css-transformer');
var query = require('component-query');
var debounce = require('debounce');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var GalleryEntry = require('../gallery-entry');
var debug = require('debug')('editor:gallery');

/**
 * Constants
 */

var consts = require('./constants');

/**
 * Current entry
 */

var current_entry;
var dropped_ready;

/**
 * Implements an image gallery
 *
 * @param {Site} site
 * @api public
 */

function Gallery(site) {
  if (!(this instanceof Gallery)) {
    return new Gallery(site);
  }

  EventEmitter.call(this);

  // elements container
  this.els = {};

  // main element
  this.el = document.createElement('div');
  this.el.className = 'gallery';

  this.els.main = this.el;

  // entries container
  this.entries = [];

  this.state = 'normal';
  this.layout = 'square';

  // wp.site instance reference
  this.site = site;

  // uploading counter
  this.uploading_counter = 0;

  // Events
  var bound_resize = debounce(this.requestRender.bind(this), 300);
  window.addEventListener('resize', function(e) {
    if (!e) return;
    if (e.target != window) return;
    bound_resize();
  });
}

/**
 * Inherit protos from `EventEmitter`
 */

inherits(Gallery, EventEmitter);

/**
 * Adds a new entry to the gallery
 *
 * @param {Object} data
 * @api public
 */

Gallery.prototype.addEntry = function (data) {
  // check file and MIME type
  if (data.file) {
    if (!/image\/.*/.test(data.file.type)) {
      return debug('file is NOT an image');
    }
  }

  var prev_count = this.count();
  var entry = GalleryEntry(data, this);

  // set entry order
  this.injectEntry(entry);

  // Listen - `ready to drop` entry event`
  this.moveTimer = null;
  entry.on('ready to drop', this.onreadytomove.bind(this));
  entry.on('entry leave', this.onentryleave.bind(this));
  entry.on('entry drop', this.onentrydrop.bind(this));

  entry.on('print', this.requestRender.bind(this));

  this.emit('add entry', entry, prev_count, this.count());
  return entry;
};

/**
 * Move given entry to this gallery
 * Actually a new entry is created and
 * the given entry is destroyed
 *
 * @param {Entry} entry
 * @api public
 */

Gallery.prototype.moveEntry = function(entry) {
  var data = {};

  if (entry.uploading) {
    data.file = entry.file;
  } else {
    data.src = entry.src;
    data.id = entry.id;
  }

  // create new entry in this gallery
  this.addEntry(data);

  // destroy given entry
  entry.destroy();
};

/**
 * Set entry position
 *
 * @param {Object} entry
 * @param {Object} transform css transform object
 * @api public
 */

Gallery.prototype.entryTransform = function(entry, transform) {
  var el = entry.el;
  cssTransform.set(el, transform);
  entry.adjust();
};

/**
 * Set entry order
 *
 * @param {Entry} entry
 * @api private
 */

Gallery.prototype.injectEntry = function(entry) {
  // set entry.order property
  if ('undefined' != typeof entry.order) {
    debug('trying to add %o entry in %o position', entry.id, entry.order);
    if (!this.entries[entry.order]) {
      this.entries[entry.order] = entry;
    } else {
      debug('position isn\'t available. Injecting in %o position.', entry.order);
      this.entries.splice(entry.order, 0, entry);
    }
  } else {
    this.entries.push(entry);
    entry.order = this.entries.length - 1;
    debug('entry order: %o', entry.order);
  }
};

/**
 * Renders the gallery
 *
 * @api private
 */

Gallery.prototype.requestRender = function() {
  this.renderOverview();
  this.emit('render');
};

/**
 * Renders the caption
 *
 * XXX: caption is not rendered for the moment
 * @api private
 */

Gallery.prototype.renderCaption = function() {
  if (this.els.caption) {
    return debug('`caption` element already has been created');
  }

  this.els.caption = document.createElement('div');
  this.els.caption.className = 'gallery-caption';

  this.els.caption.input = document.createElement('input');
  this.els.caption.input.className = 'input-caption';
  this.els.caption.input.placeholder = 'Add a caption';
  this.els.caption.appendChild(this.els.caption.input);

  this.el.appendChild(this.els.caption);

  if (this._caption) {
    this.els.caption.input.value = this._caption;
  }

  var ev = events(this.els.caption.input, this);
  ev.bind('blur', 'oncaption');
};

/**
 * Render slideshow player
 *
 * @api private
 */

Gallery.prototype.renderSlideshowPlayer = function() {
  if (this.els.slideplayer) {
    return debug('`slideshow player` element already has been created');
  }

  var player = this.els.slideplayer = document.createElement('div');
  player.className = 'gallery-player show';

  var controls = ['prev', 'play', 'next'];
  for (var i = 0; i < controls.length; i++) {
    debug('adding %o button', controls[i]);
    var btn = document.createElement('a');
    btn.setAttribute('href', '#');
    dataset(btn, 'action', controls[i]);
    btn.className = 'button-' + controls[i];
    player.appendChild(btn);
  }
  this.el.appendChild(player);

  // handler player buttons events
  var ev = events(player, this);
  ev.bind('click a', 'onplayer');
};

/**
 * Play slideshow
 *
 * @api public
 */

Gallery.prototype.play = function() {
  debug('play slideshow player');

  this.slideshow.timer = setInterval(function() {
    debug('auto-play slideshow player');
    var n = this.slideshow.current + 1;
    n = n >= this.entries.length ? 0 : n;
    this.slideshowFrame(n);
  }.bind(this), consts.TIMER);
};

/**
 * Stop slideshow
 *
 * @api private
 */

Gallery.prototype.stop = function() {
  if (!this.slideshow) return;

  debug('stop slideshow player');
  clearTimeout(this.slideshow.timer);
};

/**
 * Bind `click` event to player button
 *
 * @param {Object} ev
 * @api private
 */

Gallery.prototype.onplayer = function(ev) {
  ev.preventDefault();
  this.stop();

  var btn = ev.target;
  var btn_class = classes(btn);

  var action = btn.getAttribute('data-action');
  debug('%o slideshow action', action);

  switch(action){
    case 'prev':
      this.slideshowFrame(this.slideshow.current - 1);
      if (this.slideshow.playing) this.play();
    break;

    case 'play':
      btn_class.toggle('active');
      this.slideshow.playing = btn_class.has('active');

      if (this.slideshow.playing) {
        this.play();
      }
    break;

    case 'next':
      this.slideshowFrame(this.slideshow.current + 1);
      if (this.slideshow.playing) this.play();
    break;
  }
};

/**
 * Set frame in slideshow
 *
 * @param {Number} n - frame number
 * @param {Boolean} init - init slideshow status
 * @api Public
 */

Gallery.prototype.slideshowFrame = function(n, init) {
  if (n == this.slideshow.current && !init) {
    return debug('%o frame is already focused', n);
  }

  if (n < 0) {
    n = this.entries.length - 1;
    debug('slidehow last one frame. go to first one');
  }

  if (n > (this.entries.length - 1)) {
    n = 0;
    debug('slidehow first one frame. go to last one');
  }

  // overview
  var ov = this.els.overview;
  var current_entry = this.entries[n];
  var prev_entry = this.entries[this.slideshow.current];

  debug('set %o frame', n);

  switch(this.slideshow.mode){
    case 'fading':
      if (init) break;

      for (var i = 0; i < this.entries.length; i++) {
        var entry = this.entries[i];
        var limit = entry.order >= n;
        var z = limit ? (this.entries.length - i + n) : (i + 1);
        entry.el.style.zIndex = z;
      }

      // send to back / bring to front animation
      var prev_z = prev_entry.el.style.zIndex;
      prev_entry.el.style.zIndex = this.entries.length + 1;
      prev_entry.classes.add('fade');

      setTimeout(function() {
        prev_entry.classes.remove('fade');
        prev_entry.el.style.zIndex = prev_z;
      }, 220);
    break;

    case 'slideshow':
      // get current entry left position
      var coors = ov.getBoundingClientRect();
      var entry_coors = current_entry.el.getBoundingClientRect();
      var x = entry_coors.left - coors.left;

      // set left style property
      ov.style.left = -x + 'px';
    break;
  }

  this.slideshow.current = n;
};

/**
 * Save caption data in meta
 *
 * @param {Object} e event
 * @api private
 */

Gallery.prototype.oncaption= function(e) {
  this._caption = e.target.value;
};

/**
 * Set current caption value
 *
 * @param {String} v
 */

Gallery.prototype.caption = function(v) {
  if ('undefined' == typeof v) return this._caption;

  this._caption = v;
  if (this.els.caption) {
    this.els.caption.input.value = this._caption;
  }
};

/**
 * Renders a gallery entry
 *
 * @api private
 */

Gallery.prototype.renderEntry = function(entry) {
  entry.setStyle('circle' == this.layout ? 'circle' : 'square');

  if (entry.el.parentNode) {
    return debug('Entry already inserted in DOM tree');
  }

  return this.els.overview.appendChild(entry.el);
};

/**
 * Swap entries position into the gallery
 *
 * @param {Object} first
 * @param {Object} second
 * @api private
 */

Gallery.prototype.swapEntries = function(first, second) {
  if (first.order == second.order) {
    this.cleanActiveEntries();
    return debug('dragged and dropped is the same entry: %o', first.order, first.id);
  }

  debug('swapping %o(%s) by %o(%s)', first.order, first.id, second.order, second.id);

  var first_order = first.order;

  // swap in entries array
  this.entries[first_order] = second;
  this.entries[second.order] = first;

  // swap order properties
  first.order = second.order;
  second.order = first_order;

  // clean css classes
  first.classes.remove('drag-start');
  first.classes.remove('drag-enter');
  second.classes.remove('drop-enter');

  this.requestRender();
  setTimeout(function(){ this.cleanActiveEntries(); }.bind(this), 205);
};

/**
 * Bind `click` event in delete entry element
 *
 * Emit
 *  - `delete entry`
 *
 * @param {Object} ev
 * @param {Object} entry
 * @api private
 */

Gallery.prototype.removeEntry = function(entry) {
  // remove entry from entries array
  var order = entry.order || this.entries.indexOf(entry);
  var prev_count = this.count();

  if (order >= 0) {
    this.entries.splice(order, 1);
  }

  this.emit('delete entry', entry, prev_count, this.count());

  // change layout to single image
  if (this.count() === 1) {
    this.setLayout('stack');
  }

  // redefine entries order
  for (var i = 0; i < this.entries.length; i++) {
    if (this.entries[i].order >= order) {
      this.entries[i].order--;
    }
  }

  this.requestRender();
};

/**
 * Renders the gallery's overview
 *
 * @api private
 */

Gallery.prototype.renderOverview = function() {
  debug('rendering ...');
  if (!this.els.overview) {
    this.els.overview = document.createElement('div');
    this.els.overview.className = 'overview';
    this.el.appendChild(this.els.overview);
  }

  // show/hide slideshow player
  var isSlideshow = 'slideshow' == this.layout;
  if (this.els.slideplayer) {
    classes(this.els.slideplayer)[isSlideshow ? 'add' : 'remove']('show');
  }

  if (!isSlideshow) {
    // remove slideshow animation
    classes(this.els.overview).remove('animation');
    // move slideshow wrapper to beginning
    this.els.overview.style.left = '0px';
    this.stop();

    var play = query('.active', this.els.slideplayer);
    if (play) {
      classes(play).remove('active');
    }
  }

  // render the current layout
  var render_name = this.layout[0].toUpperCase() + this.layout.substr(1);
  var render_method = 'render' + render_name;
  if (!this[render_method]) {
    return debug('`%s()` method is not defined', render_method);
  }

  debug('processing %s with %s entries', render_name, this.count());

  // add delay if the current layout is `slideshow` 
  setTimeout(function(){ this[render_method](); }.bind(this), isSlideshow ? 250 : 0);
};

/**
 * Renders the gallery's layout slideshow
 *
 * @param {String} [mode]
 * @api private
 */

Gallery.prototype.renderSlideshow = function(mode) {
  // init vars
  var totalWidth = this.els.overview.offsetWidth;
  var height = Math.min(totalWidth, consts.ENTRY_MAX_HEIGHT);
  var left = 0;

  mode = mode || 'fading';

  // set gallery size
  this.el.style.height = height + 'px';

  for (i = 0; i < this.entries.length; i++) {
    var entry = this.entries[i];
    this.renderEntry(entry);
    var tr;

    // set entry size
    this.setEntrySize(entry, totalWidth, height);

    switch(mode){
      case 'fading':
        tr = { translate: '0px, 0px' };
        this.entryTransform(entry, tr);
        entry.el.style.zIndex = this.entries.length - entry.order;
      break;

      case 'slideshow':
        tr = { translate: (left + 'px') + ', 0px' };
        this.entryTransform(entry, tr);

        // move entry to right
        left += totalWidth;
      break;
    }
  }

  // init slideshow property
  this.slideshow = { current: 0, timer: null, played: false, mode: mode };

  // add slideshow player
  this.renderSlideshowPlayer();

  // move the slideshow to current position if it has been already created
  if (this.slideshow) {
    setTimeout(function(){
      this.slideshowFrame(this.slideshow.current, true);
    }.bind(this), 200);
  }

  // add slideshow animation
  classes(this.els.overview).add('animation');
};

/**
 * Renders the gallery's layout as circles
 *
 * @api private
 */

Gallery.prototype.renderCircle = function() {
  this.renderSquare();
};

/**
 * Renders the gallery's layout as squares
 *
 * @api private
 */

Gallery.prototype.renderSquare = function() {
  var totalWidth = this.els.overview.offsetWidth;

  var targetWidth;
  var i = consts.ENTRIES_PER_LINE;

  do {
    targetWidth = Math.floor((totalWidth - consts.ENTRY_SPACING * (i - 1)) / i);
    i++;
  } while (targetWidth > consts.ENTRY_MAX_WIDTH);

  var n = Math.floor((totalWidth + consts.ENTRY_SPACING) / (targetWidth + consts.ENTRY_SPACING));
  var compensation = (totalWidth - (n * targetWidth + (n - 1) * consts.ENTRY_SPACING)) / 2;
  compensation = Math.floor(compensation);

  var left = 0;
  var top = 0;

  for (i = 0; i < this.entries.length; i++) {
    var entry = this.entries[i];
    if (!entry) continue;

    this.renderEntry(entry);

    // set entry size
    if (entry.el.style.width != consts.ENTRY_MAX_WIDTH + 'px') {
      this.setEntrySize(entry, consts.ENTRY_MAX_WIDTH);
    }

    if (entry.el.style.height != consts.ENTRY_MAX_WIDTH + 'px') {
      this.setEntrySize(entry, null, consts.ENTRY_MAX_WIDTH);
    }

    // set entry transform
    var tr = {
      translate: (compensation + left + 'px') + ',' + (top + 'px'),
      scale: targetWidth / 200
    };
    this.entryTransform(entry, tr);

    left += targetWidth + consts.ENTRY_SPACING;
    if (left + targetWidth > totalWidth) {
      left = 0;
      top += targetWidth + consts.ENTRY_SPACING;
    }
  }

  // set gallery size
  if (left === 0) {
    this.el.style.height = top + consts.ENTRY_SPACING + 'px';
  } else {
    this.el.style.height = top + targetWidth + consts.ENTRY_SPACING + 'px';
  }

  this.dispatchResize();
};

/**
 * Renders the gallery's layout as a masonry
 *
 * @api private
 */

Gallery.prototype.renderRectangular = function() {
  var totalWidth = this.els.overview.offsetWidth;

  var left = 0;
  var top = 0;
  var pending = 0;
  var i, j, _entry;

  for (i = 0; i < this.entries.length; i++) {
    var entry = this.entries[i];
    if (!entry) continue;

    this.renderEntry(entry);

    var height = consts.ENTRY_MAX_WIDTH;
    var width;

    // compute width
    if (typeof(entry.width) == 'undefined') {
      width = 0;
    } else {
      width = entry.width / entry.height * height;
    }

    // re-set entry el width
    if (entry.el.style.width != width + 'px') {
      entry.el.style.width = width + 'px';
    }

    // re-set entry el height
    if (entry.el.style.height != height + 'px') {
      this.setEntrySize(entry, null, height);
    }

    entry.left = left;
    entry.top = top;

    var tr = { translate: (left + 'px') + ',' + (top + 'px') };
    this.entryTransform(entry, tr);

    left += width + consts.ENTRY_SPACING;
    pending++;

    if (left > totalWidth) {
      tr = { scale: totalWidth / (left - pending * consts.ENTRY_SPACING) };

      for (j = i; j > i - pending; j--) {
        _entry = this.entries[j];
        if (_entry){
          tr.translate = (_entry.left * tr.scale + 'px') + ',' + (_entry.top + 'px');
          this.entryTransform(_entry, tr);
        }
      }

      pending = 0;
      left = 0;
      top += height * tr.scale + consts.ENTRY_SPACING;
    }
  }

  if (left === 0) {
    this.el.style.height = top + consts.ENTRY_SPACING + 'px';
  } else {
    var compensation = (totalWidth - left) / 2;
    for (j = i - 1; j > i - 1 - pending; j--) {
      _entry = this.entries[j];
      var trs = {
        translate: (compensation + _entry.left + 'px') + ',' + (_entry.top + 'px')
      };
      this.entryTransform(_entry, trs);
    }
    this.el.style.height = top + consts.ENTRY_MAX_WIDTH + consts.ENTRY_SPACING + 'px';
  }

  this.dispatchResize();
};

/**
 * Renders the gallery's layout as a stack
 *
 * @api private
 */

Gallery.prototype.renderStack = function() {
  var totalWidth = this.els.overview.offsetWidth;

  var top = 0;

  var l = this.count();
  for (var i = 0; i < l; i++) {
    var entry = this.entries[i];
    if (!entry) {
      debug('undefined entry');
      continue;
    }

    if (!entry.width) {
      debug('current entry image without size');
      continue;
    }

    this.renderEntry(entry);

    var height;
    var width;

    if (typeof(entry.width) == 'undefined') {
      width = 0;
    } else if (entry.width > totalWidth) {
      width = totalWidth;
    } else {
      width = entry.width;
    }

    if (typeof(entry.height) == 'undefined') {
      height = 0;
    } else {
      height = entry.height / entry.width * width;
    }

    if (entry.el.style.width != width + 'px') {
      this.setEntrySize(entry, width);
    }

    if (entry.el.style.height != height + 'px') {
      this.setEntrySize(entry, null, height);
    }

    var tr = { translate : (totalWidth - width) / 2 + 'px, ' + top + 'px' };
    this.entryTransform(entry, tr);

    top += height + consts.ENTRY_SPACING;
  }

  this.el.style.height = top + 'px';

  this.dispatchResize();
};

/**
 * Handles clicks on the "Done" button
 *
 * @api private
 */

Gallery.prototype.onDoneClick = function() {
  this.state = 'normal';
  this.requestRender();
};

/**
 * Bind `ready to drop` gallery event
 */

Gallery.prototype.onreadytomove = function(drag, drop) {
  clearTimeout(this.moveTimer);

  this.moveTimer = setTimeout(function(_drag, _drop) {
    this.moveEntries(_drag, _drop);
  }.bind(this, drag, drop), 800);
};

/**
 * Bind `entry leave` event
 *
 * @param {Entry} drag
 * @param {Entry} drop
 * @api private
 */

Gallery.prototype.onentryleave = function(drag, drop) {
  clearTimeout(this.moveTimer);
};

/**
 * Bind `entry drop` event
 *
 * @param {Entry} drag
 * @param {Entry} drop
 * @api private
 */

Gallery.prototype.onentrydrop = function(drag, drop) {
  // move immediately
  clearTimeout(this.moveTimer);
  this.moveEntries(drag, drop);
};

/**
 * Move given entries
 *
 * @param {Entry} drag
 * @param {Entry} drop
 * @api private
 */

Gallery.prototype.moveEntries = function(drag, drop) {
  var i;
  var entry;
  var prev;

  // move all gallery entries
  if (drag.order < drop.order) {
    for (i = 0; i < this.entries.length; i++) {
      entry = this.entries[i];
      if (drag.order < entry.order && entry.order <= drop.order && prev) {
        this.swapEntries(prev, entry);
      }
      prev = this.entries[i];
    }
  } else {
    for (i = this.entries.length - 1; i >= 0; i--) {
      entry = this.entries[i];
      if (drag.order > entry.order && entry.order >= drop.order && prev) {
        this.swapEntries(prev, entry);
      }
      prev = this.entries[i];
    }
  }

  drag.classes.add('drop-ready');
  dropped_ready = drag;

  drag.classes.remove('drop-ready');
  drag.classes.remove('drag-enter');
  drop.classes.remove('drop-enter');
};

/**
 * Check if there are two entries ready to swap them
 *
 * @param {Entry} entry
 * @api private
 */

Gallery.prototype.onactiveentry = function(entry) {
  if ('slideshow' == this.layout) {
    return debug('not swap in slideshow layout');
  }

  if (this.count() < 2) {
    entry.classes.remove('entry-active');
    return debug('not active with only one entry');
  }

  var actives = this.entries.filter(function(entry) { return entry.active; });
  if (actives.length > 1) {
    this.swapEntries(actives[0], actives[1]);
  }
};

/**
 * Clean all active entries into the gallery
 *
 * @api private
 */

Gallery.prototype.cleanActiveEntries = function() {
  for (var i = 0; i < this.entries.length; i++) {
    var entry = this.entries[i];
    entry.classes.remove('entry-active');
    entry.active = false;
  }
};

/**
 * Set gallery layout
 *
 * @param {String} layout
 * @api public
 */

Gallery.prototype.setLayout = function(layout) {
  if (layout == this.layout) {
    return debug('Same layout');
  }

  var el_classes = classes(this.el);
  el_classes.remove('layout-' + this.layout);

  this.layout = layout;
  el_classes.add('layout-' + this.layout);

  debug('layout: `%s`', layout);
  this.requestRender();
};

/**
 * Returns the number of entries on the gallery
 *
 * @api public
 */

Gallery.prototype.count = function() {
  return this.entries.length;
};

/**
 * Destroy stuff
 */

Gallery.prototype.destroy = function() {
  debug('destroying gallery ...');

  // remove main contaner element
  this.el.parentNode.removeChild(this.el);

  // clean entries array
  this.entries = [];
  this.entries.length = 0;

  // set destroyed state
  this.destroyed = true;

  // emit
  this.emit('destroy', this);
};

/**
 * Dispatch a resize DOM event to notify of changes
 */

Gallery.prototype.dispatchResize = function() {
  // A DOM event is used here instead of an EventEmitter event
  // because its 'bubble' property makes the handling much more elegant,
  // since we only need to listen for events on a parent node.
  // (Like the one used by the overlay manager)
  var ev;
  try {
    ev = new CustomEvent('resize', { 'bubbles': true, 'cancelable': false });
  } catch (e) {
    // DOM 4 event creation is not supported
    ev = document.createEvent('CustomEvent');
    ev.initCustomEvent('resize', true, false, {});
  }
  this.el.dispatchEvent(ev);
};

/**
 * Set entry size
 *
 * @param {Entry} entry
 * @param {Number} w
 * @param {Number} h
 * @api private
 */

Gallery.prototype.setEntrySize = function(entry, w, h) {
  var s = {};

  if (w) {
    s.w = Math.round(w);
    entry.el.style.width = s.w + 'px';
  }

  if (h) {
    s.h = Math.round(h);
    entry.el.style.height = s.h + 'px';
  }

  entry.emit('size', s);
};

/**
 * Module Exports
 */

module.exports = Gallery;
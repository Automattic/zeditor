
/**
 * Module dependencies
 */

var Spinner = require('../progress-spinner');
var isFile = require('data-transfer-is-file');
var events = require('component-events');
var classes = require('component-classes');
var cssTransform = require('css-transformer');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var debug = require('debug')('editor:gallery-entry');

/**
 * Constants
 */

var consts = require('../gallery/constants');

/**
 * Dragged entry
 */

var dragged_entry;
var dragged_ghost;

/**
 * Expose `Entry` module
 */

module.exports = Entry;

/**
 * Create an Entry instance
 *
 * @param {Object} data
 * @param {Gallery} gallery
 * @api public
 */

function Entry(data, gallery) {
  if (!(this instanceof Entry)) {
    return new Entry(data, gallery);
  }

  EventEmitter.call(this);

  // parent gallery reference
  this.gallery = gallery;

  // set initial properties
  this.setOptions(data);

  // init DOM elements
  this.setElements();

  // init events
  this.setEvents();

  // detect entry type
  type(this);

  // print entry image
  this.print();

  // adjust css3 parent transformation
  this.gallery.on('render', this.adjust.bind(this));

  this.on('print file', function () {
    // auto-uploading file
    if (data.autouploading !== false && 'file' == this.type) {
      this.upload();
    }
  }.bind(this));

  this.on('size', function (s) {
    if (!this.spinner) return;
    this.spinner.updateSize(this.width, this.height);
  }.bind(this));


  debug('initialized: %o', this);
}

/**
 * Inherits from `EventEmitter`
 */

inherits(Entry, EventEmitter);

/**
 * Set options
 */

Entry.prototype.setOptions = function (opts) {
  for (var k in opts) {
    this[k] = opts[k];
    debug('set %o option: %o', k, this[k]);
  }
};

/**
 * Set file source
 *
 * @param {File} file
 * @api public
 */

Entry.prototype.setFile = function (file) {
  this.file = file;
  type(this);
  debug('set source file');
};

/**
 * Set image source
 *
 * @param {String} src
 * @api public
 */

Entry.prototype.setImage = function (src) {
  this.src = src;
  type(this);
  debug('set image file');
};

/**
 * Set entry style
 *  - `square` (default)
 *  - `circle`
 *
 * @param {String} [mode]
 * @api public
 */

Entry.prototype.setStyle = function (mode) {
  mode = mode || 'square';

  if (mode == this.style) {
    return debug('current style is %o', mode);
  }

  // remove previous style css class
  this.classes.remove('style-' + this.style);

  // set current entry style
  this.style = mode;
  this.classes.add('style-' + this.style);
};

/**
 * Init DOM elements
 */

Entry.prototype.setElements = function () {
  // set DOM elements prp
  var els = this.els = {};

  // main element
  var main = els.main = document.createElement('div');
  main.className = 'entry';
  main.setAttribute('draggable', true);
  main.setAttribute('oncontextmenu', 'return false;');

  // delete button element
  els.del = document.createElement('a');
  els.del.className = 'delete';
  main.appendChild(els.del);

  // background image element
  els.bgi = document.createElement('div');
  els.bgi.className = 'entry-image';
  els.main.appendChild(els.bgi);

  // grabber drag element
  els.grabber = document.createElement('div');
  els.grabber.className = 'entry-grabber';
  els.main.appendChild(els.grabber);

  // store main element in this.el property
  this.el = main;

  // add classes handler
  this.classes = classes(this.el);
};

/**
 * Init events stuff
 */

Entry.prototype.setEvents = function () {
  var evs = this.evs = {};

  // handling `delete` button event
  evs.del = events(this.els.del, this);
  evs.del.bind('click', 'ondelete');

  // drag and drop - drag before start
  evs.el = events(this.el, this);
  evs.el.bind('mousedown', 'ondragbeforestart');
  evs.el.bind('mouseup', 'onnondrop');

  // drag and drop - drag start
  evs.el.bind('dragstart', 'ondragstart');
  evs.el.bind('dragend', 'ondragend');
  evs.el.bind('dragover', 'ondragover');

  // drag and drop - dragging
  evs.el.bind('dragenter', 'ondragenter');
  evs.el.bind('dragleave', 'ondragleave');

  evs.el.bind('drop', 'ondrop');
};

/**
 * Adjust
 *  - css3 transformations
 *  - `draggable` html attribute
 *  - uploading mask
 *
 * @api public
 */

Entry.prototype.adjust = function () {
  var tr = cssTransform(this.el);
  tr.scale = 1 / Number(tr.scale || 1);

  if (tr.scale === 1) delete tr.scale;
  delete tr.translate3d;

  cssTransform.set(this.els.del, tr);

  // `draggable` attribute
  if (this.gallery.count() == 1) {
    this.el.removeAttribute('draggable');
  } else {
    this.el.setAttribute('draggable', true);
  }

  if (this.uploading) {
    var w, h;
    if ('square' == this.gallery.layout || 'circle' == this.gallery.layout) {
      w = h = this.width;
    } else if ('slideshow' == this.gallery.layout) {
      w = this.el.style.width;
      h = this.el.style.height;

      w = w.substr(0, w.length - 2) | 0;
      h = h.substr(0, h.length - 2) | 0;

      this.spinner.updateSize(w, h);
    } else {
      w = this.width;
      h = this.height;
    }

    this.spinner.updateSize(w, h);
  }
};

/**
 * Print `file` entry
 *
 * - Emit 'print' event
 *
 * @api public
 */

Entry.prototype.print = function () {
  var bount = emitPrint.bind(this);

  if ('file' == this.type) {
    this.printFile(bount);
  } else {
    this.printImage(bount);
  }

  // call to emit `print` event
  function emitPrint () {
    this.emit('print');
  }
};

/**
 * Print file image
 *
 * - Emit `print file` event
 *
 * @param {Function} fn
 * @api public
 */

Entry.prototype.printFile = function (fn) {
  fn = fn || function(){};

  // create tempo elements to get image properties
  var canvas = document.createElement('canvas');
  var img = document.createElement('img');

  img.onload = function(){
    var w, h;
    if (img.width > img.height) {
      canvas.width = w = consts.ENTRY_MAX_WIDTH * (img.width / img.height) *
                         consts.PIXEL_RATIO;
      canvas.height = h = consts.ENTRY_MAX_WIDTH * consts.PIXEL_RATIO;
    } else {
      canvas.width = w = consts.ENTRY_MAX_WIDTH * consts.PIXEL_RATIO;
      canvas.height = h = consts.ENTRY_MAX_WIDTH * (img.height / img.width) *
                          consts.PIXEL_RATIO;
    }

    this.width = img.width;
    this.height = img.height;

    var ctxt = canvas.getContext('2d');
    ctxt.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
    URL.revokeObjectURL(img.src);

    this.els.bgi.style.backgroundImage = 'url(' + canvas.toDataURL() + ')';

    this.emit('print file', this);
    fn();
  }.bind(this);

  img.src = URL.createObjectURL(this.file);
};

/**
 * Print `image` entry
 *
 * @param {Function} fn
 * @api public
 */

Entry.prototype.printImage = function (fn) {
  fn = fn || function(){};

  var img = document.createElement('img');

  debug('loading %o image', this.src);

  img.onload = function(){
    this.width = img.width;
    this.height = img.height;

    this.els.bgi.style.backgroundImage = 'url(' + this.src + ')';
    fn();
  }.bind(this);

  img.src = this.src;
};

/**
 * Upload file entry
 *
 * - Emit `start upload` before to start uploading
 * - Emit `upload` after uploading file
 *
 * @param {Function} fn
 * @api public
 */

Entry.prototype.upload = function (fn) {
  fn = fn || function () {};

  this.start_mark_time = +(new Date());

  // add progress spinner
  this.spinner = Spinner();
  this.el.appendChild(this.spinner.render());
  this.spinner.updateSize(this.width, this.height);

  var site_id = this.gallery.site._id;

  if (!site_id) {
    debug('WARN: site_id is not defined');
    return fn(new Error('Site id is not defined'));
  }

  // control by uploading status flag
  if (this.uploading) {
    debug('file is been uploading');
    return fn();
  }

  // control by entry id
  if (this.id) {
    debug('Entry has already defined its %o id', this.id);
    return fn();
  }

  // turn `on` uploading flag
  this.uploading = true;

  // method, params and file name
  var method = this.file ? 'addFiles' : 'addUrls';
  var param = this.file ? this.file : this.src; 
  var name = this.file ? this.file.name : this.src;

  debug('uploading %o using %o method to %o blog', name, method, site_id);

  this.classes.add('uploading');

  // galley stuff
  this.gallery.uploading_counter++;
  this.gallery.emit('entry start upload', this, this.gallery.uploading_counter);

  // add hack to emit event
  setTimeout(function(){ this.emit('start upload'); }.bind(this), 0);

  var self = this;

  var req = this.gallery.site
  .media()
  [method](param, function(err, data){
    self.uploading = false;
    var lapse = (+new Date() - self.start_mark_time);
    debug('wp response lapse: %sms', lapse);

    if (err) return fn(err);

    // ensure spinner is 100%
    self.spinner.duration(400).go(100);
    setTimeout(function(){
      self.spinner.hide();
    }, 500);

    self.setDataFromResponse(data.media[0]);

    self.classes.remove('uploading');
    self.classes.add('uploaded');

    // gallery stuff
    self.gallery.uploading_counter--;
    self.gallery.emit('entry upload', self, self.gallery.uploading_counter);

    self.emit('upload', data);

    self.cleanCanvasImage(function(){
      // clean file from entry
      delete self.file;
      self.type = 'image';

      fn(null, data);
    });
  });

  // listening uploding process
  req.upload.onprogress = this.onuploadingprogress.bind(this);
};

/**
 * Bind to `onprogress` upload event
 *
 * @param {Object} e
 * @api private
 */

Entry.prototype.onuploadingprogress = function (e) {
  // percentage of `uploading process` of the complete process
  var uploading_percentage = 0.7;
  var fake_percentage = 0.9;

  // fake time percentage
  var fake_delay_percentage = 0.5;

  // update spinner value
  var v = (e.loaded / e.total * 100) | 0;

  debug('uploading progress: %o', v);
  this.spinner.go(v * uploading_percentage);

  if (v < 100) return;

  // make fake animation
  var lapse = (+new Date() - this.start_mark_time);
  debug('progress lapse: %sms', lapse);

  lapse *= fake_delay_percentage;
  debug('fake lapse: %sms', lapse);

  this.spinner
  .duration(lapse | 0)
  .go(100 * fake_percentage);
};

/**
 * Event - bind `click` event in delete button element
 *
 * - Emit `destroy`
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondelete = function (ev) {
  ev.preventDefault();
  ev.stopPropagation();

  this.destroy();
};

/**
 * Destroy entry
 *
 * Emit
 *  - `destroy` event
 *
 * @param {String} name description
 */

Entry.prototype.destroy = function () {
  // remove DOM element
  if (this.el.parentNode) {
    delElement(this.el);
  }

  // remove entry from gallery
  this.gallery.removeEntry(this);

  this.emit('destroy', this);
};

/**
 * Event - bind `mousedown` event to main element
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragbeforestart = function (ev) {
  if (openContextMenu(ev)) return;

  if (!this.el.hasAttribute('draggable')) {
    return debug('entry not draggable');
  }

  if (ev.target == this.els.del) {
    return debug('dragging in delete button element');
  }

  var gallery = this.gallery;
  var drag = this.el;

  // create drag dragged_ghost element
  dragged_ghost = document.createElement('div');

  // un-scale the dragged_ghost element
  var tr = cssTransform(drag);
  tr.scale = 1 / Number(tr.scale || 1);
  cssTransform.set(dragged_ghost, tr);

  // same background-image
  dragged_ghost.style.backgroundImage = this.els.bgi.style.backgroundImage;

  // set size
  var w = this.el.style.width;
  w = Number(w.substr(0, w.length - 2));
  w = Math.min (100, w);

  var h = this.el.style.height;
  h = Number(h.substr(0, h.length - 2));
  h = Math.min (100, h);

  // scale compensation
  w /= tr.scale;
  h /= tr.scale;

  var v = Math.min(w, h);
  dragged_ghost.style.width = v + 'px';
  dragged_ghost.style.height = v + 'px';

  debug('set size: %o, %o', v, v);

  // set coors
  // relative position
  var coors = drag.getBoundingClientRect();

  // css translate compensation
  var compensation = tr.translate3d.split(/px[,\s]*/);

  // client coordinates
  var x = ev.clientX - coors.left - compensation[0] - Math.min(v, 100) + 90;
  var y = ev.clientY - coors.top - compensation[1] - Math.min(v, 100) + 90;

  debug('set position: %o, %o', x, y);
  dragged_ghost.style.left = x + 'px';
  dragged_ghost.style.top = y + 'px';

  // handler dragged_ghost css classes
  classes(dragged_ghost).add('drag-ghost');
  classes(dragged_ghost).add('drag-ghost-before-start');
  classes(dragged_ghost).add('style-' + this.style || 'squeare');

  debug('injecting dragged_ghost element');
  this.el.appendChild(dragged_ghost);

  this.classes.add('drag-before-start');
};

/**
 * Bind `mouseup` event to main element
 *
 * @param {Object} ev
 * @api public
 */

Entry.prototype.onnondrop = function (ev) {
  debug('onnondrop');
  // active entry
  this.classes.toggle('entry-active');
  this.active = this.classes.has('entry-active');
  if (this.active) {
    this.gallery.onactiveentry(this);
    this.emit('active', this);
  }

  // remove dragged ghost element
  delElement(dragged_ghost);
};

/**
 * Event - bind `dragstart` event to main element
 * Emit
 *  - `drag start`
 *  - `entry drag start` in gallery instance
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragstart = function (ev) {
  if (!this.el.hasAttribute('draggable')) {
    return debug('entry not draggable');
  }

  ev.dataTransfer.setData('text/plain',null);

  var drag = this.el;

  dragged_entry = this;
  this.emit('drag start', dragged_entry);
  this.gallery.emit('entry drag start', dragged_entry);

  // adjust styles in dragged_ghost element
  var size = dragged_ghost.style.width;
  dragged_ghost.removeAttribute('style');
  dragged_ghost.style.backgroundImage = this.els.bgi.style.backgroundImage;
  dragged_ghost.style.width = size;
  dragged_ghost.style.height = size;

  // handler dragged_ghost css classes
  classes(dragged_ghost).remove('drag-ghost-before-start');
  classes(dragged_ghost).add('drag-ghost-start');

  if (dragged_ghost) {
    // move dragged_ghost to DOM tree root
    document.body.appendChild(dragged_ghost);
    var coors = drag.getBoundingClientRect();
    dragged_ghost.style.left = coors.left + 'px';
    dragged_ghost.style.top = coors.top + 'px';

    ev.dataTransfer.setDragImage(dragged_ghost, 10, 10);
  }

  // handler drag css classes
  this.classes.remove('drag-before-start');
  this.classes.add('drag-start');
};

/**
 * Event - bind `dragend` event to main element
 *
 * Emit
 *  - `drag end`
 *  - `entry drag end` in gallery instance
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragend = function (ev, entry) {
  delElement(dragged_ghost);
  this.classes.remove('drag-start');
  this.emit('drag end', this);
  this.gallery.emit('entry drag end', this);
  dragged_entry = null;
};

/**
 * Event - bind `dragover` event to main element
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragover = function (ev) {
  ev.preventDefault();
  if (dragged_ghost) {
    delElement(dragged_ghost);
  }
};

/**
 * Event - bind `dragenter` event to main element
 *
 * Emit
 *  - `ready to drop`
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragenter = function (ev) {
  debug('ondragend()');

  var drag = dragged_entry;
  var drop = this;

  if (!dragged_entry) {
    return debug('no dragged entry');
  }

  if (drag.gallery.el != drop.gallery.el) {
    return debug('dropping in another gallery');
  }

  debug('current entry: %o (%o)', dragged_entry.id, dragged_entry.order);
  if (dragged_entry.order == this.order) {
    return debug('dragging in the same %o entry ...', this.order);
  }

  debug('predisposed %o, %o elements to drag and drop', drag.id, drop.id);

  drag.classes.add('drag-enter');
  drop.classes.add('drop-enter');

  this.emit('ready to drop', drag, drop);
};

/**
 * Event - bind `dragleave` event to main element
 * Detect `drop` element
 *
 * @param {Object} ev
 * @api private
 */

Entry.prototype.ondragleave = function (ev) {
  var drag = dragged_entry;

  if (!dragged_entry) {
    return debug('no dragged entry');
  }

  if (dragged_entry.id == this.id) {
    return debug('still ready to drag and drop elements');
  }

  var drop = this;

  drag.classes.remove('drag-enter');
  drop.classes.remove('drop-enter');
  this.emit('entry leave', drag, drop);
};

/**
 * Event - bind `drop` event to main element
 *
 * @param {Object} e
 * @api private
 */

Entry.prototype.ondrop = function (e) {
  if (isFile(e)) return;

  this.emit('entry drop', dragged_entry, this);
};

/**
 * Clean canvas image and replace it
 * by background image css property
 *
 * @param {Object} entry
 * @param {Function} fn
 * @api private
 */

Entry.prototype.cleanCanvasImage = function (fn) {
  var self = this;

  // create dragged_ghost temporal image
  var img = document.createElement('img');
  img.onload = function(){
    var bgi = 'url(' + img.src + ')';
    self.els.bgi.style.backgroundImage = bgi;
    fn(bgi);
  };
  img.src = this.src;
};

/**
 * Set entry properties getting data
 * from the rest-api response
 *
 * @param {Object} data
 * @api private
 */

Entry.prototype.setDataFromResponse = function (data) {
  // pass properties in the response to this object
  this.id = data.ID;
  this.src = data.URL;

  this.attr = {};
  this.attr.src = this.src;
  this.attr.width = data.meta.width;
  this.attr.height = data.meta.height;

  // complete caption properties
  this.caption = {};
};


/**
 * Detect entry type
 *
 * @param {Object} entry
 * @api private
 */

function type(entry) {
  // entry source type
  entry.type = entry.file ? 'file' : (entry.src ? 'image' : undefined);
  return debug('type detected: %o', entry.type);
}

/**
 * Remove the given element from the DOM tree
 *
 * @param {Element} el
 * @api private
 */

function delElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
    debug('delete element');
  }
}

/**
 * Detect if the event opens the context menu
 *
 * @param {Object} ev - event object
 * @api private
 */

function openContextMenu(ev) {
  if (ev.ctrlKey) return true;
  if (ev.button && 2 == ev.button) return true;
  return false;
}
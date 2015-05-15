
/**
 * Module Dependencies
 */

var domify = require('domify');
var query = require('component-query');
var classes = require('component-classes');
var inserted = require('inserted');
var filePicker = require('component-file-picker');
var inherits = require('inherits');

var isFile = require('data-transfer-is-file');
var Block = require('../block');
var Gallery = require('../gallery');
var Controls = require('../block-controls');
var debug = require('debug')('editor:block-gallery');

/**
 * Templates
 */

var el = domify(require('./gallery-block')());
var imagePlaceholder = domify(require('./image-placeholder')());
var galleryPlaceholder = domify(require('./gallery-placeholder')());

/**
 * Current dragging entry
 */

var current_entry;

/**
 * Exports
 */

module.exports = GalleryBlock;

/**
 * Represents a Block holding a Gallery
 *
 * @param {String|Object|Array} mode|files
 * @param {Editor} editor
 * @api public
 */

function GalleryBlock(mode_files, editor){
  if (!(this instanceof GalleryBlock)) {
    return new GalleryBlock(mode_files, editor);
  }

  var mode = '';
  var files = [];
  var params = {};

  if ('string' == typeof mode_files) {
    mode = mode_files;
  } else if (typeof mode_files.length == 'number') {
    files = mode_files;
  } else {
    params = mode_files;
    files = params.files || [];
    mode = params.mode || '';
    this.source = params.source;
  }

  // set mode depending of images count
  if (files.length > 1) {
    mode = 'gallery';
  } else {
    mode = 'image';
  }

  debug('mode: %s', mode);
  debug('files: ', files);

  Block.call(this, el.cloneNode(true));

  // todo: make sure that late binding is possible
  this.bind(editor);

  this.body = query('.body', this.overlay);

  // Create Gallery instance
  this.gallery = Gallery(editor.site);
  if (params.layout) {
    this.gallery.setLayout(params.layout);
  }

  // bing gallery events
  this.gallery.on('render', this.onrender.bind(this));
  this.gallery.on('entry drag start', this.ongalleryentrystart.bind(this));
  this.gallery.on('entry drag end', this.ongalleryentryend.bind(this));

  // refresh bound
  var refresh_bound = this.refresh.bind(this);
  this.gallery.on('add entry', refresh_bound);
  this.gallery.on('delete entry', refresh_bound);

  // add gallery controls
  this.addGalleryControls();

  // set gallery block mode
  this.setMode(mode);

  // listen and bind super 'remove' event
  this.on('destroy', this.ondestroy.bind(this));

  // listening overlay element `inserted` event
  inserted(this.overlay, this.oninserted.bind(this));

  // add files to gallery entries
  // update gallery mode
  for (var i = 0; i < files.length; i++) {
    this.gallery.addEntry({ file: files[i] });
  }
}

inherits(GalleryBlock, Block);

/**
 * Set gallery source
 * the `source` can be a raw-image <img ... />
 * or a [gallery] shortcode
 *
 * @param {String} s
 * @api public
 */

GalleryBlock.prototype.source = function(s){
  this._source = s;
};

/**
 * Add gallery controls to block gallery
 *
 * @api private
 */

GalleryBlock.prototype.addGalleryControls = function(){
  this.controls = new Controls();

  // Add admin controls
  var evs = [
    'add',
    'left',
    'none',
    'right',
    'slideshow',
    'circle',
    'square',
    'rectangular',
    'stack'
  ];

  for (var i = 0; i < evs.length; i++) {
    this.controls.on(evs[i], this['oncontrol' + evs[i]].bind(this));
  }
};

/**
 * Refresh block gallery stuff:
 *
 *  - gallery-count element attribute
 *  - gallery visibility through css display propertie
 *
 *  @param {Entry} entry
 *  @param {Number} prev previous gallery count
 *  @param {Number} count current gallery count
 *  @api private
 */

GalleryBlock.prototype.refresh = function(entry, prev, count) {
  count = count || this.gallery.count();
  // set gallery-count attribute
  this.body.setAttribute('gallery-count', count);

  // refresh gallery mode
  this.setMode(count > 1 ? 'gallery' : 'image');

  // check if we have to switch between single/multiple images layout
  if (count == 1 && (prev > 1 || !prev)) {
    this.float('none');
    this.gallery.setLayout('stack');
  } else if (count > 1 && prev == 1) {
    this.float('none');
    this.gallery.setLayout('square');
  }

  // show/hide gallery/placeholder
  if (count > 0) {
    this.placeholder.style.display = 'none';
    this.gallery.el.style.display = 'block';
  } else {
    this.placeholder.style.display = 'block';
    this.gallery.el.style.display = 'none';
  }

  this.gallery.requestRender();
};

/**
 * Set gallery mode
 *
 * @param {String} mode
 * @api public
 */

GalleryBlock.prototype.setMode = function(mode) {
  // check if the mode changes
  if (this.mode != mode) {
    this.mode = mode;
    debug('new gallery drop: %o', this.mode);

    this.updateControls();
    this.updatePlaceholder();
  }
};

/**
 * Update the gallery controls
 *
 * @api public
 */

GalleryBlock.prototype.updateControls = function(){
  debug('onUpdateControls()');

  this.controls.reset();
  this.controls.add('add', false, false);

  if (this.mode == 'gallery') {
    this.controls.actions(['square', 'circle', 'rectangular', 'slideshow']);
  } else if (this.mode == 'image') {
    this.controls.actions(['left', 'none', 'right'], 1);
  }
};

/**
 * Update placeholder element
 *
 * @api public
 */

GalleryBlock.prototype.updatePlaceholder = function(){
  if (this.placeholder) {
    this.body.removeChild(this.placeholder);
  }

  if (this.mode == 'gallery') {
    this.placeholder = galleryPlaceholder.cloneNode(true);
  } else if (this.mode == 'image') {
    this.placeholder = imagePlaceholder.cloneNode(true);
  }

  this.placeholder.addEventListener('click', this.oncontroladd.bind(this), false);
  this.body.appendChild(this.placeholder);
};

/**
 * Called whenever we're inserted into the DOM
 */

GalleryBlock.prototype.oninserted = function(){
  debug('oninserted()');
  this.body.appendChild(this.gallery.el);
  this.body.appendChild(this.controls.el);
  this.refresh();
};

/**
 * Called whenever the user drags files over the gallery
 */

GalleryBlock.prototype.onDragEnter = function(e){
  // check if it is the same gallery through of its element
  if (current_entry && this.gallery.el == current_entry.gallery.el) return;

  Block.prototype.onDragEnter.call(this, e);
};

/**
 * onDragEnter
 * @param  {Object} e event
 */

GalleryBlock.prototype.onDragOver = function(e){
  var bounds = this.el.getBoundingClientRect();
  e.preventDefault();
  e.stopPropagation();
  
  if (e.clientY < bounds.top + 20 || e.clientY > bounds.bottom - 20) {
    if (classes(this.overlay).has('drag-hover')) {
      classes(this.overlay).remove('drag-hover');
      this.editor.autoscroll.stop();
    }
    if (!this.editor.drag.dragging) {
      this.editor.drag.start(document.createDocumentFragment());
    }
    this.editor.drag.update(this.el, e.clientX, e.clientY);
  } else {
    if (!classes(this.overlay).has('drag-hover')) {
      classes(this.overlay).add('drag-hover');
      this.editor.autoscroll.start();
    }
    if (this.editor.drag.dragging) {
      this.editor.drag.cancel();
    }
  }
  this.editor.autoscroll.target(e.clientX, e.clientY);
};

/**
 * Called whenever the user drags files over the gallery
 */

GalleryBlock.prototype.onDragLeave = function(e){
  debug('onDragLeave()');
  e.preventDefault();
  if (classes(this.overlay).has('drag-hover')) {
    classes(this.overlay).remove('drag-hover');
    this.editor.autoscroll.stop();
  }
};

/**
 * Called whenever the user drags files or Entries over the gallery
 *
 * @param {Object} e
 * @api private
 */

GalleryBlock.prototype.onDrop = function(e){
  e.preventDefault();
  e.stopPropagation();

  if (this.editor.drag.dragging) {
    this.editor.media.onDrop(e);
  } else {
    classes(this.overlay).remove('drag-hover');

    if (isFile(e)) {
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        this.gallery.addEntry({ file: e.dataTransfer.files[i] });
      }
    } else if (current_entry && this.gallery.el != current_entry.gallery.el) {
      this.changeEntryOfGallery(current_entry);
    }

    this.refresh();
  }
};

/**
 * Bind to gallery `render` event
 *
 * @api private
 */

GalleryBlock.prototype.onrender = function (){
  this.editor.overlay.update();
};

/**
 * Bind `entry drag start` gallery event
 *
 * @param {Entry} entry
 * @api private
 */

GalleryBlock.prototype.ongalleryentrystart = function(entry){
  current_entry = entry;
  this.editor.emit('gallery entry drag start', current_entry, this);
};

/**
 * Bind `entry drag end` gallery event
 *
 * @param {Entry} entry
 * @api private
 */

GalleryBlock.prototype.ongalleryentryend = function(entry){
  this.editor.emit('gallery entry drag end', current_entry, this);
  current_entry = null;
};

/**
 * Bind to super block `destroy` event
 *
 * @api private
 */

GalleryBlock.prototype.ondestroy = function(){
  debug('destroying ...');
  this.gallery.destroy();
};

/**
 * Bind to controls `add` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontroladd = function(){
  debug('oncontrol - add');

  filePicker({ multiple: true, accept: 'image/*'}, function(files){
    for (var i = 0; i < files.length; i++) {
      this.gallery.addEntry({ file: files[i] });
    }
    this.refresh();
  }.bind(this));
};

/**
 * Bind to controls `left` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolleft = function(){
  debug('oncontrol - left');
  this.float('left');
  this.gallery.setLayout('stack');
  this.gallery.requestRender();
};

/**
 * Bind to controls `none` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolnone = function(){
  debug('oncontrol - none');
  this.float('none');
  this.gallery.setLayout('stack');
  this.gallery.requestRender();
};

/**
 * Bind to controls `right` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolright = function(){
  debug('oncontrol - right');
  this.float('right');
  this.gallery.setLayout('stack');
  this.gallery.requestRender();
};

/**
 * Bind to controls `circle` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolcircle = function(){
  debug('oncontrol - circle');
  this.gallery.setLayout('circle');
};

/**
 * Bind to controls `circle` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolslideshow = function(){
  debug('oncontrol - slideshow');
  this.gallery.setLayout('slideshow');
};

/**
 * Bind to controls `square` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolsquare = function(){
  debug('oncontrol - square');
  this.gallery.setLayout('square');
};

/**
 * Bind to controls `rectangular` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolrectangular = function(){
  debug('oncontrol - rectangular');
  this.gallery.setLayout('rectangular');
};

/**
 * Bind to controls `stack` event
 *
 * @api private
 */

GalleryBlock.prototype.oncontrolstack = function(){
  debug('oncontrol - stack');
  this.gallery.setLayout('stack');
};

/**
 * Create a new block gallery from an entry drop
 *
 * @param {Entry} entry
 * @param {Element} [ref] - reference element to inject new gallery
 * @api public
 */

GalleryBlock.prototype.newGalleryFromEntry = function(entry, ref){
  // create a new gallery
  var block = new GalleryBlock({
    layout: 'stack',
    mode: 'image',
    site_id: this.editor.site._id
  }, this.editor);

  if (ref) {
    // inject new galley in ref element
    ref.appendChild(block.el);
  } else {
    this.editor.block(block.el);
  }

  // move given entry to new gallery
  block.gallery.moveEntry(entry);

  setTimeout(function(){ block.refresh(); }, 100);
};

/**
 * Change the dropped entry to another gallery
 *
 * @param {Entry} entry
 * @api private
 */

GalleryBlock.prototype.changeEntryOfGallery = function(entry, gallery){
  // move given entry to this gallery
  this.gallery.moveEntry(entry);
  this.refresh();
};

/**
 * Html gallery render
 *
 * @api private
 */

GalleryBlock.prototype.html = function(){
  var wrapper = domify('<div>');
  wrapper.className = 'tiled-gallery ' + 'type-' + this.gallery.layout;

  var entries = this.gallery.entries;

  wrapper.style.height = this.gallery.el.style.height;

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    // create a new node cloning entry main element
    var el = entry.el.cloneNode();

    el.removeAttribute('draggable');
    el.removeAttribute('oncontextmenu');

    if (entry.els.bgi) {
      el.style['background-image'] = entry.els.bgi.style['background-image'];
    }

    listenUploading(el, entry);
    wrapper.appendChild(el);
  }

  return wrapper;
};

/**
 * Serialize gallery block
 *
 * @api public
 */

GalleryBlock.prototype.serialize = function(){
  debug('serializing ...');

  var wrapper = document.createElement('p');
  var entries = this.gallery.entries;

  if (entries.length != 1) {

    // build `ids` attribute
    var ids = [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i]) ids.push(entries[i].id);
    }

    ids = ' ids="' + ids.join(',') + '"';

    // build `caption` attribute
    var caption = this.gallery._caption ? ' caption="' + this.gallery._caption + '"' : ''; 

    // build gallery `type` attribute
    var gallery_type = ' type="' + this.gallery.layout + '"';

    // build finally the shortcode
    var shortcode = '[gallery' + caption + ids + gallery_type + ']';

    debug('shorcode: `%s`', shortcode);
    wrapper.appendChild(document.createTextNode(shortcode));
  } else if (entries[0]) {
    this.serializeSingleImage(entries[0], wrapper);
  }

  return wrapper;
};

/**
 * Serialize a gallery-block with only one image
 *
 * @param {Object} entry
 * @param {Element} wrapper
 * @api private
 */

GalleryBlock.prototype.serializeSingleImage = function(entry, wrapper){
  debug('single %o image', entry.id || 'no-defined');

  // set align image
  var elcss = classes(this.el);
  var align = elcss.has('right') ? 'right'
            : (elcss.has('left') ? 'left' : 'none');
  align = 'align' + align;
  debug('align: %o', align);

  // attributes entry object
  entry.attr = entry.attr || {};

  // set align in class attribute
  entry.attr.class = entry.attr.class || '';
  if (/align\w*/.test(entry.attr.class)) {
    entry.attr.class = entry.attr.class.replace(/align\w*/, align);
  } else {
    entry.attr.class += ' ' + align;
  }

  // set image id in class attribute
  if (entry.id) {
    var id = 'wp-image-' + entry.id;
    if (/wp-image-\d*/.test(entry.attr.class)) {
      entry.attr.class = entry.attr.class.replace(/wp-image-\d*/, id);
    } else {
      entry.attr.class += ' ' + id;
    }
  }

  // `src`, `width` and `height` properties must be defined
  entry.attr.src = entry.attr.src || entry.src;
  entry.attr.width = 'alignnone' == align ? (entry.attr.width || entry.width) : '50%';
  entry.attr.height = entry.attr.height || entry.height;

  // create img element
  var img = document.createElement('img');
  for (var k in entry.attr) {
    debug('set image attr: %o=%o', k, entry.attr[k]);
    img.setAttribute(k, entry.attr[k]);
  }

  // reference element to insert
  var ref = img;

  // create anchor wrapper element
  if (entry.anchor && entry.anchor.href) {
    var anchor = document.createElement('a');
    for (var l in entry.anchor) {
      debug('set anchor attr: %o=%o', l, entry.anchor[l]);
      anchor.setAttribute(l, entry.anchor[l]);
    }
    anchor.appendChild(img);
    ref = anchor;
  }

  wrapper.appendChild(ref);

  // add [caption] wrap shortcode
  if (this.gallery.caption()) {
    var caption_pre = '[caption';

    // caption default properties
    entry.caption = entry.caption || {};
    entry.caption.id = entry.caption.id || 'attachment_' + entry.id;
    entry.caption.width = entry.caption.width || entry.width;

    // set caption alignment
    entry.caption.align = align;

    for (var m in entry.caption) {
      if (entry.caption[m]) {
        caption_pre += ' ' + m + '="' + entry.caption[m] + '"';
      }
    }
    caption_pre += ']';
    debug('image caption: %o', caption_pre);

    caption_pre = document.createTextNode(caption_pre);

    var caption_post = document.createTextNode(this.gallery.caption() + '[/caption]');
    wrapper.insertBefore(caption_pre, ref);
    wrapper.insertBefore(caption_post, ref.nextSibling);
  }
};

/**
 * Adjust element and
 * listen `upload file` entry event
 *
 * @param {Element} el
 * @param {Entry} entry
 * @api private
 */

function listenUploading(el, entry){
  // set uploading class
  if (!entry.uploading) return;

  // wait to uploading image
  entry.on('upload', function(data){
    classes(el).remove('uploading');

    // wait to image uploaded
    entry.cleanCanvasImage(function(bgi){
      el.style['background-image'] = bgi;
    });
  });
}

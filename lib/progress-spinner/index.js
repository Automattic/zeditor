
/**
 * Module dependencies
 */

var query = require('component-query');
var classes = require('component-classes');
var debug = require('debug')('editor:progress-spinner');

/**
 * Expose `Spinner` function
 */

module.exports = Spinner;

/**
 * Implement a progress spinner
 *
 * @param {Object} opts
 * @api public
 */

function Spinner(opts) {
  if (!(this instanceof Spinner)) {
    return new Spinner(opts);
  }

  // initial value
  this.v = 0;

  // options 
  opts = this.opts = opts || {};

  this.set('size', opts.size || { w: 100, h: 100 });

  // options - radio scale
  this.set('scale', opts.scale || 0.4);

    // options - width
  this.set('width', opts.width || 4);

  // options - transition duration
  this.set('duration', opts.duration || 500);

  // options - transition timing function
  this.set('timing', opts.timing || 'ease-in');

  // radio
  this.r = this.get('size').w / 2;
  debug('radio: %s', this.r);

  this.w = this.get('size').w;
  this.h = this.get('size').h;

  // create DOM element
  this.el = document.createElement('div');
  this.el.className = 'progress-spinner-container';

  this.el.innerHTML = this.html();

  // get path element
  this.path = query('path.progress-spinner-border', this.el);
  this.mask = query('path.progress-spinner-mask', this.el);
  this.center = query('path.progress-spinner-center', this.el);

  this.svg = query('svg', this.el);

  debug('progress-spinner created');
}

/**
 * Retrun DOM element
 *
 * @api public
 */

Spinner.prototype.render = function () {
  return this.el;
};

/**
 * Update mask size
 *
 * @param {Number} w - width
 * @param {Number} h - height
 * @api public
 */

Spinner.prototype.updateSize = function (w, h) {
  var rate = w / h;
  debug('rate: %o', rate);
  var viewbox = '0 0 ';

  if (rate >= 1) {
    viewbox += this.get('size').w * rate + ' ' + this.get('size').h;
    this.w = this.get('size').w * rate;
    this.h = this.get('size').h;
  } else {
    viewbox += this.get('size').w + ' ' + this.get('size').h / rate;
    this.w = this.get('size').w;
    this.h = this.get('size').h / rate;
  }

  debug('updating viewBox: %o', viewbox);
  this.svg.setAttribute('viewBox', viewbox);

  // external circle
  var r1 = this.r * this.get('scale');
  this.mask.setAttribute('d', renderExternalCircle(this.w, this.h, r1));

  // internal circle
  var r2 = this.r * this.get('scale') - this.get('width');
  this.center.setAttribute('d', renderInternalCircle(this.w, this.h, r2));

  // spinner path
  var rp = r2 + this.get('width') / 2;
  this.path.setAttribute('d', renderInternalCircle(this.w, this.h, rp));
};

/**
 * Render html markup
 *
 * @api private
 */

Spinner.prototype.html = function () {
  // external circle
  var r1 = this.r * this.get('scale');

  // internal circle
  var r2 = this.r * this.get('scale') - this.get('width');

  return '<svg viewbox="0 0 ' + this.w + ' ' + this.h + '">' +
    '<path class="progress-spinner-mask" ' +
      'fill="rgba(50, 65, 84, 0.75)" ' +
      'd="' + renderExternalCircle(this.w, this.h, r1) + '">' +
    '</path>' +

    '<path class="progress-spinner-center" ' +
      'fill="rgba(50, 65, 84, 0.75)" ' +
      'd="' + renderInternalCircle(this.w, this.h, r2) + '">' +
    '</path>' +

    '<path class="progress-spinner-border" ' +
      'stroke="rgba(255, 255, 255, 0.9)" ' +
      'fill="transparent" ' +
      'stroke-width=" ' + this.get('width') + '" ' +
      'stroke-linecap="round"' + 
    '</path>' +

  '</svg>';
};

/**
 * Set progress value
 *
 * @param {Number} v - value 0 to 100
 * @param {Number} [init] - initial value
 * @api public
 */

Spinner.prototype.go = function (v, init) {
  // initial value
  init = 'undefined' == typeof init ? this.v : init;

  // store current value
  this.v = v;
  debug('progress: %s', this.v);

  // radio
  var r = this.r * this.get('scale') - (this.get('width') / 2);
  this.path.setAttribute('d', renderSpinnerPath(this.w, this.h, r));

  // animation
  var total = this.path.getTotalLength();

  // clear any previous transition
  this.path.style.transition = this.path.style.WebkitTransition = 'none';

  // Set up the starting positions
  this.path.style.strokeDasharray = total + ' ' + total;
  this.path.style.strokeDashoffset = total;

  // initial value
  this.path.style.strokeDashoffset = total * (100 - init) / 100;

  // picks up the starting position before animating
  this.path.getBoundingClientRect();

  // Define transition
  var transition = [
    'stroke-dashoffset',
    this.get('duration') + 'ms',
    'ease-in-out'
  ].join(' ');

  this.path.style.transition =
  this.path.style.WebkitTransition = transition;

  // Go!
  this.path.style.strokeDashoffset = total * (100 - v) / 100;
};

/**
 * Hide spinner
 *
 * @api public
 */

Spinner.prototype.hide = function () {
  classes(this.el).add('hide');
};

/**
 * Set transition duration
 * 
 * @param {Integer} d - duration in ms
 * @api public
 */

Spinner.prototype.duration = function (d) {
  return this.set('duration', d);
};

/**
 * Set transition timing-function
 * 
 * @param {String} timing
 * @api public
 */

Spinner.prototype.timing = function (timing) {
  return this.set('timing', timing);
};

/**
 * Get option property
 *
 * @param {String} opt - option key
 * @return {any} value
 * @api public
 */

Spinner.prototype.get = function (k) {
  if ('undefined' == typeof this.opts[k]) {
    return debug('WARN: %s is not defined', k);
  }
  return this.opts[k];
};

/**
 * Set option property
 *
 * @param {String} k - option key
 * @param {any} v - value
 * @api public
 */

Spinner.prototype.set = function (k, v) {
  this.opts[k] = v;
  debug('%s: %o', k, v);
  return this;
};

/**
 * Return d path for external circle
 *
 * @param {Integer} w - box width
 * @param {Integer} h - box height
 * @param {Integer} r - radio
 * @api private
 */

function renderExternalCircle (w, h, r) {
  var circle =  'M 0 0' +
                ' L ' + w + ' 0' +
                ' L ' + w + ' ' + h +
                ' L 0 ' + h +
                ' L 0 0' +
                ' M ' + (w / 2) + ' ' + (h / 2 - r) +
                ' a ' + r + ' ' + r + ', 0, 1, 0, 0 ' + 2 * r +
                ' a ' + r + ' ' + r + ', 0, 1, 0, 0 -' + 2 * r;
  debug('external circle: %o', circle);
  return circle;
}

/**
 * Return d path for internal circle
 *
 * @param {Integer} w - box width
 * @param {Integer} h - box height
 * @param {Integer} r - radio
 * @api private
 */

function renderInternalCircle (w, h, r) {
  var circle =  ' M ' + (w / 2) + ' ' + (h / 2 - r) +
                ' a ' + r + ' ' + r + ', 0, 1, 0, 0 ' + 2 * r +
                ' a ' + r + ' ' + r + ', 0, 1, 0, 0 -' + 2 * r;
  debug('external circle: %o', circle);
  return circle;
}

/**
 * Return d path for spinner path
 *
 * @param {Integer} w - box width
 * @param {Integer} h - box height
 * @param {Integer} r - radio
 * @api private
 */

function renderSpinnerPath (w, h, r) {
  var path =  'M ' + (w / 2) + ' ' + (h / 2) + ' ' +
              'm 0 -' + r + ' ' +
              'a ' + r + ' ' + r + ' 0 1 0 0 ' + r * 2 + ' ' +
              'a ' + r + ' ' + r + ' 0 1 0 0 -' + r * 2;

  debug('spinner path: %o', path)
  return path;
}
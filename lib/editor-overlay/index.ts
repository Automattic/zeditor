/// <reference path="../../types.d.ts" />

/**
 * Module dependencies
 */

import Editor = require('../editor/index');
import classes = require('component-classes');
import query = require('component-query');
import computedStyle = require('computed-style');
import raf = require('raf');
import uid = require('component-uid');
import dataset = require('dataset');
import hacks = require('../hacks/index');

var TRANSFORM = ['transform', 'webkitTransform', 'MozTransform', 'msTransform', 'OTransform'].filter((prop) => document.body.style[prop] != null)[0];

/**
 * Editor overlay
 *
 * @param {Element} el
 * @api public
 */

class EditorOverlayManager {

  private editor: Editor;
  private ref: HTMLElement;
  private el: HTMLElement;
  private overlays: Object;
  private interval: number;
  private raf: any;
  private timer: any;

  constructor(editor: Editor) {
    if (!(this instanceof EditorOverlayManager)) return new EditorOverlayManager(editor);

    this.editor = editor;
    this.ref = editor.el;
    this.el = document.createElement('div');
    this.el.className = 'editor-overlay';
    this.overlays = {};
    this.interval = 0;
    this.raf = null;
    this.timer = null;

    // cache the bound callback, to avoid binding it every time
    this['callback'] = this.callback.bind(this);

    this.el.addEventListener('resize', () => {
      this.update(true);
    });
      
    this.timeout();
  }

  /**
   * Creates a reference element for an overlay element
   */

  public reference(overlay: HTMLElement): HTMLElement {
    var el = document.createElement('div');
    el.className = 'overlay-reference';
    var br = document.createElement('br');
    el.appendChild(br);
    var id = uid(8);
    dataset(el, 'id', id);
    this.add(id, overlay);
    return el;
  }

  /**
   * Adds an overlay element to the overlay manager
   */

  private add(id: string, overlay: HTMLElement): void {
    overlay.style.display = 'none';
    this.overlays[id] = overlay;
    this.el.appendChild(overlay);
  } 

  /**
   * Get the overlay for the given reference
   */

  public 'for'(el: HTMLElement): HTMLElement {
    return this.overlays[dataset(el, 'id')];
  }

  /**
   * Update the position of the overlays based on the
   * positions of the references
   */

  public update(changed: boolean = false): void {
    var i: number;
    var id: string;
    var ref: HTMLElement;
    var overlay: HTMLElement;
    var refBox: ClientRect;

    // mark all overlays as not present
    for (id in this.overlays) {
      overlay = this.overlays[id];
      overlay['present'] = false;
    }

    var refs = query.all('[data-id]', this.ref);

    // iterate through all overlay references and
    // set the overlay widths based on their widths
    for (i = 0; i < refs.length; i++) {
      ref = refs[i];
      id = ref.getAttribute('data-id');
      overlay = this.overlays[id];

      if (overlay) {
        refBox = ref.getBoundingClientRect();
        if (overlay.style.display != 'block') {
          overlay.style.display = 'block';
          changed = true;
        }
        var width = refBox.width + 'px';
        if (overlay.style.width != width) {
          overlay.style.width = width;
          changed = true;
        }
        // mark found overlay as present
        overlay['present'] = true;
      }
    }

    // iterate through all overlay references
    // and set their heights based on the overlay heights
    for (i = 0; i < refs.length; i++) {
      ref = refs[i];
      id = ref.getAttribute('data-id');
      overlay = this.overlays[id];

      if (overlay) {
        var overlayBox = overlay.getBoundingClientRect();

        if (hacks.overlayReferenceUsePadding) {
          refBox = ref.getBoundingClientRect();
          var paddingBottom = Math.max(0, parseInt(ref.style.paddingBottom || '0px', 10) + Math.round(overlayBox.height - refBox.height)) + 'px';
          if (ref.style.paddingBottom != paddingBottom) {
            this.editor.transactions.runAndSquash(() => {
              ref.style.paddingBottom = paddingBottom;
            });
            changed = true;
          }
        } else {
          var height = overlayBox.height + 'px';
          if (ref.style.height != height) {
            this.editor.transactions.runAndSquash(() => {
              ref.style.height = height;
            });
            changed = true;
          }
        }
      }
    }

    // iterate through all overlay references and
    // set their heights based on the overlay heights
    var externalBox = this.el.getBoundingClientRect();
    for (i = 0; i < refs.length; i++) {
      ref = refs[i];
      id = ref.getAttribute('data-id');
      overlay = this.overlays[id];
      if (overlay) {
        refBox = ref.getBoundingClientRect();
        if (overlay.style.position != 'absolute') {
          overlay.style.position = 'absolute';
          changed = true;
        }
        var top = (refBox.top - externalBox.top) + 'px';
        var left = (refBox.left - externalBox.left) + 'px';
        var transform = 'translate(' + left + ', ' + top + ')';

        if (overlay.style[TRANSFORM] != transform) {
          overlay.style[TRANSFORM] = transform;
          changed = true;
        }
      }
    }

    // hide all non-present overlays
    for (id in this.overlays) {
      overlay = this.overlays[id];
      if (!overlay['present']) {
        if (overlay.style.display != 'none') {
          overlay.style.display = 'none';
          changed = true;
        }
      }
    }

    this.updateSelection();

    this.timeout(changed);
  }

  /**
   * Updates the overlay classes to make them react to
   * text selections
   */

  public updateSelection(): void {

    function rangeIntersectsNode(range: Range, node: Node): boolean {
      var nodeRange = node.ownerDocument.createRange();
      try {
        nodeRange.selectNode(node);
      } catch (e) {
        nodeRange.selectNodeContents(node);
      }

      var rangeStartRange = range.cloneRange();
      rangeStartRange.collapse(true);

      var rangeEndRange = range.cloneRange();
      rangeEndRange.collapse(false);

      var nodeStartRange = nodeRange.cloneRange();
      nodeStartRange.collapse(true);

      var nodeEndRange = nodeRange.cloneRange();
      nodeEndRange.collapse(false);

      return rangeStartRange.compareBoundaryPoints(Range.START_TO_START, nodeEndRange) == -1 &&
             rangeEndRange.compareBoundaryPoints(Range.START_TO_START, nodeStartRange) == 1;
    } 

    var ref;
    var i;
    var refs = query.all('[data-id]', this.ref);
    var id;

    // iterate through all overlay references and
    // mark all overlays as not selected or focused
    for (i = 0; i < refs.length; i++) {
      ref = refs[i];
      id = ref.getAttribute('data-id');
      overlay = this.overlays[id];
      classes(overlay).remove('focused').remove('selected');
    }

    var selection = window.getSelection();
    if (selection.rangeCount == 0) return;
    var range = selection.getRangeAt(0);
    if (range.collapsed) {
      // check for focused overlay references
      var el = range.startContainer;
      do {
        if (el.nodeType == Node.ELEMENT_NODE &&
            (id = (<HTMLElement>el).getAttribute('data-id'))) {
          var overlay = this.overlays[id];
          if (overlay) {
            classes(overlay).add('focused');
          }
        }
      } while (el = el.parentNode);
    } else {
      // iterate through all overlay references and
      // check which of them intersect the range
      for (i = 0; i < refs.length; i++) {
        ref = refs[i];
        if (rangeIntersectsNode(range, ref)) {
          id = ref.getAttribute('data-id');
          overlay = this.overlays[id];
          classes(overlay).add('selected');
        }
      }
    }
  }

  /**
   * Called when the timer or raf fires
   */
  
  private callback() {
    this.raf = null;
    this.timer = null;
    this.update();
  }

   /**
   * Sets a timeout to update the overlay positions in the future
   */

  private timeout(changed: boolean = false): void {
    if (changed) {
      this.interval = 0;
      if (this.raf && window.cancelAnimationFrame) {
        raf.cancel(this.raf);
      }
      if (this.timer) {
        clearTimeout(this.timer);
      }
    } else if (this.timer || this.raf) return;

    if (this.interval <= 200) {
      // intervals lower or equal to 200ms trigger an animation frame
      this.raf = raf(this.callback);
    } else {
      // intervals higher than that will trigger a regular timeout
      this.timer = setTimeout(this.callback, this.interval);
    }

    // increase interval, but max at 1000ms
    if (this.interval < 1000) {
      this.interval += 25;
    }
  }
}

/**
 * Expose `EditorOverlayManager`
 */

export = EditorOverlayManager;

/// <reference path="../../types.d.ts" />

/**
 * TypeScript dependencies
 */

import Editor = require('../editor/index');
import events = require('events');
import classes = require('component-classes');
import query = require('component-query');
import domify = require('domify');
import dataset = require('dataset');
import DEBUG = require('debug');
import domSerializeInterfaces = require('dom-serialize/interfaces');
import SerializeEvent = domSerializeInterfaces.SerializeEvent;
import corejs = require('babel-runtime/core-js');
import currentSelection = require('current-selection');
import collapse = require('collapse');
import is = require('../is/index');

var debug = DEBUG('editor:editor-block');

class Block extends events.EventEmitter {

  /**
   * Private Fields
   */

  private _editor: Editor;
  private _overlay: HTMLElement;
  private _el: HTMLElement;
  private _id: string;
  private _hold: boolean = false;
  private _holdX: number = 0;
  private _holdY: number = 0;
  private static _boundEditors: WeakSet<Editor> = new corejs.default.WeakSet();

  public constructor(overlay: HTMLElement) {
    super();

    this._overlay = overlay;

    // store a reference to the block in the overlay DOM node
    this._overlay['block'] = this;
  }

  /**
   * Returns the current overlay reference for the block, searching
   * through the DOM of the editor to do so.
   */

  public get el(): HTMLElement {
    var qry = '.overlay-reference[data-id=\'' + this._id + '\']';

    try {
      var els: Array<HTMLElement> = query.all(qry, this._editor.el);
    } catch (e) {
      if (!this._editor) {
        throw new Error('Block not bound to an editor instance. You must call .bind() before accessing the \'el\' property.');
      }
      throw e;
    }

    if (els.length > 0) {
      if (els.length > 1) {
        debug('duplicate elements for block with id ' + this._id);
      }

      if (this._el != els[0]) {
        debug('updating element reference for block with id ' + this._id);
        this._el = els[0];
      }
    }

    return this._el;
  }

  /**
   * Returns the current overlay for the block
   */

  public get overlay(): HTMLElement {
    return this._overlay;
  }

  /**
   * Returns the bound editor for the block
   */

  public get editor(): Editor {
    return this._editor;
  }

  /**
   * Binds the block to the editor instance
   */

  public bind(editor: Editor) {
    if (this._editor) {
      if (this._editor == editor) return; // noop
      throw new Error('Already bound to another editor instance');
    }

    // also bind the Block class to the editor
    Block._bind(editor);

    this._editor = editor;
    this._el = editor.overlay.reference(this._overlay);
    this._id = dataset(this._el, 'id');

    this._overlay.addEventListener('dragenter', this.onDragEnter.bind(this), false);
    this._overlay.addEventListener('dragover', this.onDragOver.bind(this), false);
    this._overlay.addEventListener('dragleave', this.onDragLeave.bind(this), false);
    this._overlay.addEventListener('drop', this.onDrop.bind(this), false);

    this._overlay.addEventListener('mousedown', (e) => this.onmousedown(e), false);
    window.addEventListener('mousemove', (e) => this.onmousemove(e), false);
    window.addEventListener('mouseup', (e) => this.onmouseup(e), false);

    var deleteElement: HTMLElement = query('.delete-button', this._overlay);
    if (deleteElement) {
      deleteElement.addEventListener('click', (e) => this.onremove(e), false);
    }

    var afterElement: HTMLElement = query('.caret-after-button', this._overlay);
    if (afterElement) {
      afterElement.addEventListener('mousedown', (e) => this.onmovecaret(e), false);
    }

    var beforeElement: HTMLElement = query('.caret-before-button', this._overlay);
    if (beforeElement) {
      beforeElement.addEventListener('mousedown', (e) => this.onmovecaret(e), false);
    }
  }

  private static _bind(editor: Editor) {
    if (Block._boundEditors.has(editor)) {
      // editor is already bound to the Block class, make this a noop
      return;
    }
    Block._boundEditors.add(editor);
    editor.el.addEventListener('serialize', (e: SerializeEvent) => {
      if (is.overlayReference(e.serializeTarget)) {
        var overlay = editor.overlay.for(<HTMLElement>e.serializeTarget);
        if (overlay && overlay['block']) {
          var block: Block = <Block>(overlay['block']);
          e.detail.serialize = block.serialize(e.detail.context);
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Fired when the mouse button is pressed on the block
   */

  private onmousedown(e: MouseEvent) {
    if (e.button != 0) return;
    var c = classes(<HTMLElement>e.target);
    if (e.target == this.overlay || c.has('body') || c.has('grabber')) {
      this._editor.focus();
      this._hold = true;
      this._holdX = e.clientX;
      this._holdY = e.clientY;
      var range = document.createRange();
      range.setStart(this.el, 0);
      range.setEnd(this.el, 0);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      e.preventDefault();
      return this;
    }
  }

  /**
   * Fired when the mouse moves
   */

  private onmousemove(e: MouseEvent){
    if (this._hold && (Math.abs(this._holdX - e.clientX) > 5 || Math.abs(this._holdY - e.clientY) > 5)) {
      this._editor.drag.start(this.el);
      this._hold = false;
    } else {
      var bounding = this.el.getBoundingClientRect();
      if (e.clientX >= bounding.left &&
          e.clientX < bounding.right &&
          e.clientY >= bounding.top &&
          e.clientY < bounding.bottom) {
        this._editor.drag.update(this.el, e.clientX, e.clientY);
        this._editor.autoscroll.target(e.clientX, e.clientY);
      }
    }
  }

  /**
   * Fired when the mouse button is lifted
   */

  private onmouseup(e: MouseEvent): void{
    if (e.button != 0) return;
    this._hold = false;
  }

  /**
   * Delete block through of `delete` button
   */

  private onremove(e: MouseEvent){
    this.el.parentNode.removeChild(this.el);
    this.emit('remove');
  }

  /**
   * Move cursor either before or after the block
   */

  private onmovecaret(e: MouseEvent){

    // Figure out direction of motion
    var direction;
    if ((<HTMLElement>e.target).className == 'caret-before-button') {
      direction = -1;
    } else {
      direction = 1;
    }

    // Figure out whether we should create a new paragraph or move to an existing one
    var shouldCreate = false;
    if (direction == -1) {
      if (!this.el.previousSibling || is.overlayReference(this.el.previousSibling)) {
        shouldCreate = true;
      }
    } else {
      if (!this.el.nextSibling || is.overlayReference(this.el.nextSibling)) {
        shouldCreate = true;
      }
    }

    // To better match native behavior, we must change the selection asynchronously.
    //
    // If we change it synchronously inside the mousedown handler, and don't call
    // `e.preventDefault()` it will be overwritten by the default browser selection
    // behavior.
    //
    // If we do call `e.preventDefault()`, the default browser selection
    // behavior is also suppressed, so the user is not able to start a selection by
    // draggin before/after a block.
    //
    // Since there's no way to suppress just part of the default behavior (setting
    // caret position, but not starting a selection), what we do is that we set the
    // caret position asynchronously, so it overwrites the caret set by the default
    // browser behavior. This is not really pretty, but does the trick.
    //
    // Another way of dealing with this would be to manually implement selection
    // behavior. However that would be really complex and error prone, so this
    // approach is cleaner overall.
    //
    // TODO: figure out a way of getting the selection portion to work on Firefox
    // TODO: figure out why selection behavior gets a bit weird on Safari

    setTimeout(() => {

      var s = currentSelection(document);
      var r = document.createRange();

      if (shouldCreate) {
        var p = document.createElement('p');
        var n = document.createElement('br');
        p.appendChild(n);
        if (direction == -1) {
          this.el.parentNode.insertBefore(p, this.el);
        } else {
          this.el.parentNode.insertBefore(p, this.el.nextSibling);
        }
        r.selectNode(n);
        collapse.toStart(r);
      } else {
        if (direction == -1) {
          if (is.emptyParagraph(this.el.previousSibling)) {
            // Make sure cursor is before `<br>` tag.
            r.selectNode(this.el.previousSibling.firstChild);
            collapse.toStart(r);
          } else {
            r.selectNodeContents(this.el.previousSibling);
            collapse.toEnd(r);
          }
        } else {
          r.selectNodeContents(this.el.nextSibling);
          collapse.toStart(r);
        }
      }

      this._editor.el.focus();

      s.removeAllRanges();
      s.addRange(r);

    }, 0);
  }

  /**
   * Destroy the block
   */

  public destroy(): void {
    debug('destroying `%s` ...', this._id);
    this.emit('destroy');
  }

  /**
   * Sets the float direction of the block
   * @param {String} dir
   * @api public
   */

  public float(dir: string): void {
    var elClasses = classes(this.el);
    elClasses.remove('left');
    elClasses.remove('right');
    if (dir == 'left') {
      elClasses.add('left');
    } else if (dir == 'right') {
      elClasses.add('right');
    }

    this._editor.overlay.update();
  }

  /**
   * Serializes the block
   */

  protected serialize(context: String): Node | String {
    return document.createDocumentFragment();
  }

  protected onDragEnter(e: DragEvent) {
    this.editor.media.onDragEnter(e);
  }

  protected onDragOver(e: DragEvent) {
    this.editor.media.onDragOver(e);
  }

  protected onDragLeave(e: DragEvent) {
    this.editor.media.onDragLeave(e);
  }

  protected onDrop(e: DragEvent) {
    // There's no need to call onDrop here, because it's
    // caught on a higher level on the DOM hierarchy by
    // the media controller.

    // If you do call it here you get a double drop.

    // this.editor.media.onDrop(e);
  }
}

export = Block;

/// <reference path="../../types.d.ts" />

/**
 * TypeScript imports
 */

import currentRange = require('current-range');
import currentSelection = require('current-selection');
import getDocument = require('get-document');
import normalize = require('range-normalize');
import contains = require('node-contains');
import isBackward = require('selection-is-backward');
import selectionSetRange = require('selection-set-range');
import selectionchangePolyfill = require('selectionchange-polyfill');
import rangeEquals = require('range-equals');
import DEBUG = require('debug');

import Editor = require('../editor/index');

var debug = DEBUG('editor:editor-selectionchange');

/**
 * Editor plugin that emits a `selectionchange` event on the Editor instance
 * whenever the user changes the selection within the editor instance.
 *
 * The Range gets "normalized" via `range-normalize` module before being set
 * as the document's Selection, and set on the editor at `editor.selection`.
 *
 * @public
 */

function setup (): (editor: Editor)=>void {
  return function (editor: Editor): void {
    editor.on('focus', onfocus);
    editor.once('destroy', cleanup);

    var doc = getDocument(editor.el);
    var setting: boolean = false;

    // start the "selectionchange" event polyfill (for older browsers)
    selectionchangePolyfill.start(doc);

    var previousSelection: Range = null;

    doc.addEventListener('selectionchange', onselectionchange);

    function onfocus () {
      if (previousSelection) {
        var backward = (<any>previousSelection).backward || false;
        var selection = currentSelection(this.el);
        debug('restoring previous selection: %o backward=%o', previousSelection.toString(), backward);
        selectionSetRange(selection, previousSelection, backward);
      }
    }

    function onselectionchange (e): void {
      if (setting) {
        return debug('ignoring "selectionchange" event since in the middle of setting the Selection');
      }

      // flag to indicate that we're currently in the middle of setting
      // the Selection. That way, if another "selectionchange" event
      // fires from us modifying this selection, then we won't get into
      // a recursive loop.
      setting = true;
      debug('setting = true');

      var selection: Selection = currentSelection(doc);
      if (!selection) {
        setting = false;
        debug('setting = false');
        return debug('bailing, no current Selection');
      }

      var range: Range = currentRange(selection);
      if (!range) {
        setting = false;
        debug('setting = false');
        return debug('bailing, no current Range');
      }

      var oldRange: Range = editor.selection;
      var needsEmit: boolean = false;

      if (contains(editor.el, range.commonAncestorContainer)) {
        previousSelection = null;
        range = normalize(range.cloneRange());
        needsEmit = !rangeEquals(range, oldRange);
        if (needsEmit) {
          editor.selection = range;
          editor.backward = (<any>editor.selection).backward = isBackward(selection);
        }
      } else {
        debug('document Selection is not inside the Editor');
        previousSelection = editor.selection;
        editor.selection = null;
        needsEmit = !!oldRange;
      }

      if (needsEmit) editor.emit('selectionchange');

      setting = false;
      debug('setting = false');
    }

    function cleanup (): void {
      debug('editor-selectionchange "cleanup"');
      selectionchangePolyfill.stop(doc);
      doc.removeEventListener('selectionchange', onselectionchange);
    }
  }
}

export = setup;

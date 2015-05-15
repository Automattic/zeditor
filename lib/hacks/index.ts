/// <reference path="../../types.d.ts" />

import bowser = require('bowser');

/**
 * Wut
 */

var browser = bowser.browser;

/**
 * This class hosts the logic for all browser-specific hacks
 * used by the editor, so they're consolidated and documented in
 * in a single location.
 *
 * Browser-specific hacks are a last-case scenario practice. We
 * should use feature detection as often as possible, or use
 * code that works well across multiple browsers.
 */

class Hacks {

  /**
   * When doing DOM operations involving textNodes, store 
   * the selection range, to restore it at a later time.
   *
   * This is required to work around a Safari
   * bug (#114041) where TextNode splitting/joining
   * causes the selection to break.
   *
   * Oddly enough, stored ranges are updated
   * correctly.
   *
   * See: https://bugs.webkit.org/show_bug.cgi?id=114041
   */

  static storeSelectionForTextNodeChanges = browser.safari;
  
  /**
   * When resizing overlay references vertically, 
   * use padding instead of height to work around
   * an ugly feature of IE, where content-editable
   * elements with specified height trigger the 
   * display of an interactive resize box.
   */
 
  static overlayReferenceUsePadding = browser.msie;

  /**
   * Add a space character to the end of the line when
   * dismissing tokens to allow the user to "type his way
   * out" of the resulting dismissed content.
   *
   * This behavior is needed because for some reason
   * Firefox will not allow typing outside of an element
   * if there are no text nodes either as siblings or as
   * descendant of the sibling nodes.
   *
   * Other browsers don't exhibit this bug, and Firefox
   * only exhibits it when there's nothing after the
   * token on the same paragraph. (Or if there's an empty
   * text node)
   */

  static addSpaceOnEOLTokenDismiss = browser.firefox;
}


export = Hacks;

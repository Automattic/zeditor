import Editor = require('../editor/index');
import is = require('../is/index');
import selection = require('current-selection');
import range = require('current-range');
import split = require('split-at-range');
import position = require('./range-position');
import classes = require('component-classes');
import matches = require('matches-selector');
import DEBUG = require('debug');
import inlineElements = require('inline-elements');
import voidElements = require('void-elements');
import collapse = require('collapse');
import leafRange = require('./leaf-range');

/**
 * debug
 */

var debug = DEBUG('editor:input-normalizer');

var NON_VOID_INLINE_ELEMENTS = inlineElements.filter((el) => voidElements.indexOf(el) == -1 ).join(', ');

/**
 * Helper function to select an element
 */

function select(n: Node, around: boolean = false): void {
  var s = selection(document);
  var r = document.createRange();
  if (around) {
    r.selectNode(n);
  } else {
    r.selectNodeContents(n);
  }
  s.removeAllRanges();
  s.addRange(r);
}

/**
 * Helper function to create a newline paragraph
 */

function newline(): HTMLElement {
  var p = document.createElement('p');
  var n = document.createElement('br');
  p.appendChild(n);
  return p;
}

class InputNormalizer {

  private editor: Editor;

  constructor(editor: Editor) {
    if (!(this instanceof InputNormalizer)) {
      return new InputNormalizer(editor);
    }
    this.editor = editor;
    document.addEventListener('keydown', this.normalize.bind(this), false);
    document.addEventListener('keypress', this.normalizeOnKeyPress.bind(this), false);
    document.addEventListener('compositionstart', this.normalizeOnCompositionStart.bind(this), false);
    document.addEventListener('paste', this.normalizeOnPaste.bind(this), true);
  }

  public normalize(e: KeyboardEvent) {
    // bail if a plugin has already cancelled this event
    if (e.defaultPrevented) return debug('not normalizing, event already cancelled: %o', e);

    // bail if the keyboard event happened outside of the Editor
    if (this.editor.mousetrapStopCallback(e, <Node>e.target)) return;

    var s = selection(document);
    var r = range(s);
    if (!r) return;

    // Are both ends of the Range on the same container element?
    // If they're not, leave default browser behavior alone.
    // When necessary, a proper collapsed check is done on the
    // more specific functions called below.
    if (r.startContainer != r.endContainer) return;

    var node = this.figureOutNodeForRange(r);

    // Overlay reference interactions
    if (is.overlayReference(node)) {
      this.normalizeOnOverlayReference(e, s, r, node);
    }

    // Empty paragraph interactions
    else if (is.emptyParagraph(node)) {
      this.normalizeOnEmptyParagraph(e, s, r, node);
    }

    // General interactions
    else {
      this.normalizeGeneric(e, s, r, node);
    }

    // FIX: this is a fix for an IE bug where surprisingly
    // text can end up inserted *inside* a BR tag
    r = range(s);
    // check if selection range lies within a BR element
    if (r.startContainer.nodeName == 'BR') {
      // move it to outside, after the BR element
      select(r.startContainer, true);
      collapse.toStart(s);
    }
  }

  /**
   * Normalizes input when a compositon starts
   */

  private normalizeOnCompositionStart(e: CompositionEvent) {
    var s = selection(document);
    var r = range(s);
    if (!r) return;

    var node = this.figureOutNodeForRange(r);

    // Overlay reference interactions
    if (is.overlayReference(node)) {
      var ref = <HTMLElement>node;
      this.editor.transactions.run(() => {
        var p = newline();
        ref.parentNode.insertBefore(p, ref.nextSibling);
        select(p);
        collapse.toStart(s);
      });
    }

    // Empty paragraph interactions
    else if (is.emptyParagraph(node)) {
      // nothing to normalize for now
    }

    // General interactions
    else {
      if (!r.collapsed) {
        return;
      }

      var tcm;
      if (tcm = this.topmostContainerMatching(r.startContainer, 'a')) {
        this.normalizeOnAnchor(e, s, r, tcm);
      } else if (tcm = this.topmostContainerMatching(r.startContainer, '.zwsp')) {
        this.normalizeOnZwspSpan(e, s, r, tcm);
      }
    }
  }

  /**
   * Normalizes input when a paste takes place
   */

  private normalizeOnPaste(e: ClipboardEvent) {
    var s = selection(document);
    var r = range(s);
    if (!r) return;

    var node = this.figureOutNodeForRange(r);

    // Overlay reference interactions
    if (is.overlayReference(node)) {
      // nothing to normalize for now
    }

    // Empty paragraph interactions
    else if (is.emptyParagraph(node)) {
      // nothing to normalize for now
    }

    // General interactions
    else {
      if (!r.collapsed) {
        return;
      }

      var tcm;
      if (tcm = this.topmostContainerMatching(r.startContainer, 'a')) {
        this.normalizeOnAnchor(e, s, r, tcm);
      } else if (tcm = this.topmostContainerMatching(r.startContainer, '.zwsp')) {
        this.normalizeOnZwspSpan(e, s, r, tcm);
      }
    }
  }

  /**
   * Normalizes input when a printable key gets pressed
   */

  private normalizeOnKeyPress(e: KeyboardEvent) {
    var s = selection(document);
    var r = range(s);
    if (!r) return;

    var node = this.figureOutNodeForRange(r);

    // Overlay reference interactions
    if (is.overlayReference(node)) {
      // nothing to normalize for now
    }

    // Empty paragraph interactions
    else if (is.emptyParagraph(node)) {
      // nothing to normalize for now
    }

    // General interactions
    else {
      if (!r.collapsed) {
        return;
      }

      var tcm;
      if (tcm = this.topmostContainerMatching(r.startContainer, 'a')) {
        this.normalizeOnAnchor(e, s, r, tcm);
      } else if (tcm = this.topmostContainerMatching(r.startContainer, '.zwsp')) {
        this.normalizeOnZwspSpan(e, s, r, tcm);
      }
    }
  }

  /**
   * Figures out the node the range lies on
   */

  private figureOutNodeForRange(r: Range): Node {
    var node = r.startContainer;

    // Fixes a Firefox bug where the caret ends up outside of the
    // paragraphs, and text nodes are added to the root when typing.
    if (node == this.editor.el && r.startOffset == r.endOffset) {
      var ctnr = node.childNodes[r.startOffset];
      if (!ctnr) {
        ctnr = node.lastChild;
        var offset = (ctnr.nodeType == Node.ELEMENT_NODE) ? ctnr.childNodes.length : ctnr.textContent.length;
        r.setStart(ctnr, offset);
        r.setEnd(ctnr, offset);
      } else {
        r.setStart(ctnr, 0);
        r.setEnd(ctnr, 0);
      }
      node = ctnr;
    }

    return node;
  }

  /**
   * Find the topmost element that we can split
   */

  private topmostSplittableNode(node: Node): Node {

    for (;;) {
      if (!node.parentNode) return;
      if (node.parentNode == this.editor.el) break;
      // Properly break list items
      if (node.nodeName == 'LI' && node.parentNode.nodeName == 'UL') break;
      if (node.nodeName == 'LI' && node.parentNode.nodeName == 'OL') break;
      // Properly break elements inside block quotes
      if (node.parentNode.nodeName == 'BLOCKQUOTE') break;
      node = node.parentNode;
    }
    return node;
  }


  /**
   * Find the topmost element that matches a given selector
   */

  private topmostContainerMatching(node: Node, selector: string): HTMLElement {

    var tcm: HTMLElement = null;

    for (;;) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        if (matches(<HTMLElement>node, selector)) {
          tcm = <HTMLElement>node;
        }
      }
      if ((!node.parentNode) || (node.parentNode == this.editor.el)) break;
      node = node.parentNode;
    }

    return tcm;
  }

  /**
   * Normalizes input when the caret is on an Overlay Reference
   */

  private normalizeOnOverlayReference(e: KeyboardEvent, s: Selection, r: Range, node: Node): void {
    var ref = <HTMLElement>node;
    if (e.which == 13 /* Enter */) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.shiftKey) {
        this.editor.transactions.run(() => {
          var p = newline();
          ref.parentNode.insertBefore(p, ref);
          select(p);
          collapse.toStart(s);
        });
      } else {
        this.editor.transactions.run(() => {
          var p = newline();
          ref.parentNode.insertBefore(p, ref.nextSibling);
          select(p);
          collapse.toStart(s);
        });
      }
      e.preventDefault();
    } else if (e.which == 37 /* Left */ || e.which == 38 /* Up */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!ref.previousElementSibling) {
        this.editor.transactions.run(() => {
          var p = newline();
          ref.parentNode.insertBefore(p, ref);
          select(p);
          collapse.toStart(s);
        });
        e.preventDefault();
      }
    } else if (e.which == 39 /* Right */ || e.which == 40 /* Down */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!ref.nextElementSibling) {
        this.editor.transactions.run(() => {
          var p = newline();
          ref.parentNode.appendChild(p);
          select(p);
          collapse.toStart(s);
        });
        e.preventDefault();
      }
    } else if (e.which == 8 /* Backwards delete ("Backspace") */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      this.editor.transactions.run(() => {
        if (ref.previousElementSibling) {
          select(ref.previousElementSibling);
          collapse.toEnd(s);
        } else if (ref.nextElementSibling) {
          select(ref.nextElementSibling);
          collapse.toStart(s);
        } else {
          var p = newline();
          ref.parentNode.insertBefore(p, ref);
          select(p);
          collapse.toStart(s);
        }
        ref.parentNode.removeChild(ref);
      });
      e.preventDefault();
    } else if (e.which == 46 /* Forward delete */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      this.editor.transactions.run(() => {
        if (ref.nextElementSibling) {
          select(ref.nextElementSibling);
          collapse.toStart(s);
        } else if (ref.previousElementSibling) {
          select(ref.previousElementSibling);
          collapse.toEnd(s);
        } else {
          var p = newline();
          ref.parentNode.insertBefore(p, ref);
          select(p);
          collapse.toStart(s);
        }
        ref.parentNode.removeChild(ref);
      });
      e.preventDefault();
    }
  }

  /**
   * Normalizes input when the caret is on an empty paragraph
   */

  private normalizeOnEmptyParagraph(e: KeyboardEvent, s: Selection, r: Range, node: Node): void {
    debug('normalize empty paragraph');
    var blank = <HTMLElement>node;
    if (e.which == 8 /* Backward Delete ("Backspace") */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      if (blank.previousElementSibling) {
        this.editor.transactions.run(() => {
          var prev = blank.previousElementSibling;
          while (is.list(prev) && prev.lastElementChild) {
            prev = prev.lastElementChild;
          }
          select(prev);
          var tr = s.getRangeAt(0);
          collapse.toEnd(s);
          tr = s.getRangeAt(0);
          blank.parentNode.removeChild(blank);
        });
        e.preventDefault();
      }
    } else if (e.which == 46 /* Forward Delete */) {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      if (blank.nextElementSibling) {
        this.editor.transactions.run(() => {
          select(blank.nextElementSibling);
          collapse.toStart(s);
          blank.parentNode.removeChild(blank);
        });
        e.preventDefault();
      }
    } else if (e.which == 13 /* Enter */) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.shiftKey) {
        e.preventDefault();
        var br = document.createElement('br');
        node.appendChild(br);
        select(br, true);
        collapse.toEnd(s);
      }
    }
  }

  /**
   * Normalize generic editor content
   */

  private normalizeGeneric(e: KeyboardEvent, s: Selection, r: Range, node: Node): void {
    // check for selected text
    if (!r.collapsed) {
      return;
    }

    // find the topmost element that we can split
    node = this.topmostSplittableNode(node);

    var p = position(r, node);

    if (e.which == 13 /* Enter */) {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return;
      }

      if (this.editor.tokens.handleEnter()) {
        e.preventDefault();
        return;
      }

      // elements
      var el;

      // are we at the end of the element?
      if (p == position.END) {
        debug('end of element');
        this.editor.transactions.run(() => {
          var name = node.nodeName;

          if (name.match(/^H[1-6]$/)) {
            name = 'p';
          }

          if (e.shiftKey) {
            while (node.lastChild.nodeType == Node.ELEMENT_NODE &&
                   matches(<HTMLElement>node.lastChild, NON_VOID_INLINE_ELEMENTS)) {
              node = node.lastChild;
            }
            // when inserting a line break after a text node we actually need to
            // insert *two* BR elements to get the desired empty line. The first BR
            // causes the existing line to break, and the second one creates an editable
            // empty line. If we already have a BR element in place we
            // don't need the second one.
            if (node.lastChild.nodeName != 'BR') {
              node.appendChild(document.createElement('br'));
            }
            var n = document.createElement('br');
            node.appendChild(n);
            select(n, true);
            collapse.toStart(s);
          } else {
            el = document.createElement(name);
            var styleAttr = (<HTMLElement>node).getAttribute('style');
            if (styleAttr) {
              el.setAttribute('style', styleAttr);
            }
            el.appendChild(document.createElement('br'));
            node.parentNode.insertBefore(el, node.nextSibling);
            select(el);
            collapse.toStart(s);
          }
        });
      }

      // are we at the start of the element?
      else if (p == position.START) {
        debug('start of element');

        if (is.emptyListItem(node)) {
          e.preventDefault();
          this.editor.transactions.run(() => {
            var newList = document.createElement(node.parentNode.nodeName);
            var newParagraph = document.createElement('p');
            // move BR to paragraph
            newParagraph.appendChild(node.firstChild);
            while (node.nextSibling) {
              newList.appendChild(node.nextSibling);
            }
            if (newList.childNodes.length > 0) {
              node.parentNode.parentNode.insertBefore(newList, node.parentNode.nextSibling);
            }
            node.parentNode.parentNode.insertBefore(newParagraph, node.parentNode.nextSibling);
            node.parentNode.removeChild(node);
            select(newParagraph);
            collapse.toStart(s);
          });
          return;
        }

        this.editor.transactions.run(() => {
          var name = node.nodeName;
          if (name.match(/^H[1-6]$/)) {
            name = 'p';
          }

          if (e.shiftKey) {
            var n = document.createElement('br');
            r.insertNode(n);
            select(n);
            collapse.toEnd(s);
          } else {
            var el = document.createElement(name);
            var styleAttr = (<HTMLElement>node).getAttribute('style');
            if (styleAttr) {
              el.setAttribute('style', styleAttr);
            }
            el.appendChild(document.createElement('br'));
            node.parentNode.insertBefore(el, node);
          }
        });
      }

      // we're at the middle of the element.
      else {
        debug('middle of element');
        r = leafRange(r);
        var parts = split(node, r);
        this.editor.transactions.run(() => {
          if (e.shiftKey) {
            var n = document.createElement('br');
            r.insertNode(n);
            select(n, true);
            collapse.toEnd(s);
          } else {
            node.parentNode.insertBefore(parts[0], node);
            node.parentNode.insertBefore(parts[1], node);
            select(node.previousSibling);
            node.parentNode.removeChild(node);
            collapse.toStart(s);
          }
        });
      }
      e.preventDefault();
    } else if (e.which == 8 /* Backward delete ("backspace") */) {
      // are we at the start of the element
      if (p == position.START) {
        e.preventDefault();

        if (is.listItem(node)) {
          var parent = node.parentNode;
          var parentName = parent.nodeName;

          // first list item in a list, and another
          // list of the same type right before
          if (!node.previousSibling &&
              parent.previousSibling &&
              parent.previousSibling.nodeName == parentName) {
            this.editor.transactions.run(() => {
              while(parent.firstChild) {
                parent.previousSibling.appendChild(parent.firstChild);
              }
              parent.parentNode.removeChild(parent);
              select(node);
              collapse.toStart(s);
            });
            return;
          }

          this.editor.transactions.run(() => {
            var otherList = document.createElement(parentName);
            while (node.nextSibling) {
              otherList.appendChild(node.nextSibling);
            }

            var newParagraph = document.createElement('p');

            while (node.firstChild) {
              newParagraph.appendChild(node.firstChild);
            }

            parent.removeChild(node);

            parent.parentNode.insertBefore(otherList, parent.nextSibling);
            parent.parentNode.insertBefore(newParagraph, parent.nextSibling);

            select(newParagraph);
            collapse.toStart(s);

            return;
          });
        }

        var prev = node.previousSibling;
        var first = node.firstChild;
        if (!prev) {
          return;
        } else if (is.emptyParagraph(prev)) {
          this.editor.transactions.run(() => {
            prev.parentNode.removeChild(prev);
          });
        } else if (is.overlayReference(prev)) {
          this.editor.transactions.run(() => {
            select(prev);
            collapse.toStart(s);
          });
        } else if (is.list(prev) && prev.lastChild) {
          this.editor.transactions.run(() => {
            var referencePoint = node.firstChild;
            while (node.firstChild) {
              prev.lastChild.appendChild(node.firstChild);
            }
            node.parentNode.removeChild(node);
            select(referencePoint, true);
            collapse.toStart(s);
          });
        } else {
          this.editor.transactions.run(() => {
            while (node.firstChild) {
              prev.appendChild(node.firstChild);
            }
            select(first, true);
            collapse.toStart(s);
            node.parentNode.removeChild(node);
          });
        }
      }
    } else if (e.which == 46 /* Forward delete */) {
      // are we at the end of the element?
      if (p == position.END) {
        e.preventDefault();
        var next = node.nextSibling;
        var last = node.lastChild;
        if (!next) {
          return;
        } else if (is.emptyParagraph(next)) {
          this.editor.transactions.run(() => {
            next.parentNode.removeChild(next);
          });
        } else {
          this.editor.transactions.run(() => {
            while (next.firstChild) {
              node.appendChild(next.firstChild);
            }
            select(last, true);
            collapse.toEnd(s);
            node.parentNode.removeChild(next);
          });
        }
      }
    } else if (e.which == 27 /* Escape */) {
      if (this.editor.tokens.handleEsc()) {
        e.preventDefault();
        return;
      }
    }
  }

  /**
   * Normalize input when inside anchors (repositions caret to fix Firefox bug
   * where user would get "stuck" inside an anchor.)
   */

  private normalizeOnAnchor(e: KeyboardEvent | CompositionEvent | ClipboardEvent, s: Selection, r: Range, tcm: HTMLElement): void {
    // TODO: make sure this is 100% robust, interacts better with undo and that
    // we absolutely never keep zwsps laying around.
    var ptcm = position(r, tcm);
    if (ptcm == position.END) {
      this.editor.transactions.run(() => {
        var zwsp = document.createTextNode('\u200b');
        tcm.parentNode.insertBefore(zwsp, tcm.nextSibling);
        select(zwsp);
      });
    } else if (ptcm == position.START) {
      this.editor.transactions.run(() => {
        var zwsp = document.createTextNode('\u200b');
        tcm.parentNode.insertBefore(zwsp, tcm);
        select(zwsp);
      });
    }
  }

  /**
   * Normalize when the cursor is inside a `.zwsp` node, which by convention
   * is assumed to contain a single TextNode with the '\u200b' 0-width space
   * inside. This normalizer:
   *
   *   1) unwraps the .zwsp SPAN's child node(s) to be before the SPAN
   *   2) remove the .zwsp SPAN from the DOM completely
   *   if keyCode is "space" (32), then:
   *     3) removes the 0-width space, and manually inserts a space char TextNode
            see: http://git.io/vfT5k
   *   else
   *     3) selects the 0-width space, but *doesn't* cancel then native event
   *
   * What happens next is the native keyboard event happens, and the selected
   * 0-width space is immediately removed by new contents input from the keyboard.
   */

  private normalizeOnZwspSpan(e: KeyboardEvent | CompositionEvent | ClipboardEvent, s: Selection, r: Range, tcm: HTMLElement): void {
    debug('normalizing zero width space span (span=%o)', tcm);

    var parent: HTMLElement = <HTMLElement>tcm.parentNode;
    var zwsp: Node = tcm.firstChild;
    while (tcm.firstChild) parent.insertBefore(tcm.firstChild, tcm);
    parent.removeChild(tcm);

    if ((<KeyboardEvent>e).which == 32 /* Space */) {
      debug('removing zero width TextNode %o, adding space char manually', zwsp);
      e.preventDefault();
      var space = document.createTextNode(' ');
      r.deleteContents();
      r.insertNode(space);
      select(space);
      collapse.toEnd(s);

      // remove the 0-width space TextNode
      parent.removeChild(zwsp);
    } else {
      debug('selecting zero width TextNode %o, not preventing default', zwsp);
      select(zwsp, true);
    }
  }
}

export = InputNormalizer;

/// <reference path="../../types.d.ts" />

/**
 * TypeScript imports
 */

import throttle = require('per-frame');
import MutationObserver = require('mutation-observer');
import query = require('component-query');
import currentRange = require('current-range');
import currentSelection = require('current-selection');
import matches = require('matches-selector');
import dataset = require('dataset');
import blockElements = require('block-elements');
import inlineElements = require('inline-elements');
import voidElements = require('void-elements');
import DEBUG = require('debug');
import move = require('dom-move');

import hacks = require('../hacks/index');
import is = require('../is/index');
import EditorOverlayManager = require('../editor-overlay/index');
import Editor = require('../editor/index');
import collapse = require('collapse');

var debug = DEBUG('editor:editor-normalizer');

/**
 * All block elements defined by HTML
 */

var BLOCK_ELEMENTS = blockElements.join(', ');


/**
 * Inline elements which are non-void
 */

var NON_VOID_INLINE_ELEMENTS = inlineElements.filter((el) => voidElements.indexOf(el) == -1).join(', ');

/**
 * Formatting elements which are nested
 */

var NESTED_FORMATTING_ELEMENTS = inlineElements.filter((el) => (voidElements.indexOf(el) == -1) && el != 'span').map((el) => el + ' ' + el).join(', ');

/**
 * Formatting elements which are adjacent
 */

var ADJACENT_FORMATTING_ELEMENTS = inlineElements.filter((el) => (voidElements.indexOf(el) == -1) && el != 'span').map((el) => el + ' + ' + el).join(', ');

/**
 * Block elements which are non-void
 */

var NON_VOID_BLOCK_ELEMENTS = blockElements.filter((el) => voidElements.indexOf(el) == -1).join(', ');

/**
 * Elements allowed on the editor root element
 */

var ROOT_ELEMENTS = 'address, article, aside, blockquote, div, dl, figure, footer, h1, h2, h3, h4, h5, h6, header, hgroup, hr, ol, p, pre, section, table, ul';

/**
 * Maps some elements to specialized containers
 * IMPORTANT: we need to use upper case here, as we
 * look this up later using `element.nodeName`
 */

var WRAPPER_ELEMENTS = {
  'LI': ['UL', 'OL'],
  'DD': ['DL'],
  'DT': ['DL'],
  'FIGCAPTION': ['FIGURE'],
};

/**
 * A list of MutationRecords
 */

interface MutationRecordList extends Array<MutationRecord> {}

/**
 * Normalizes the content of the editor
 */

class EditorNormalizer {

  private editor: Editor;
  private observer: MutationObserver;
  private composition: boolean;
  private middleware: { (root: HTMLElement, subtree: HTMLElement, context?: string): void }[];

  public BEFORE_BUILTINS: (root: HTMLElement, subtree: HTMLElement, context?: string) => void;
  public AFTER_BUILTINS: (root: HTMLElement, subtree: HTMLElement, context?: string) => void;

  constructor(editor: Editor) {
    if (!(this instanceof EditorNormalizer)) return new EditorNormalizer(editor);

    this.editor = editor;
    this.observer = new MutationObserver(this.callback.bind(this));
    this.composition = false;
    this.editor.el.addEventListener('compositionstart', () => { this.composition = true }, false);
    this.editor.el.addEventListener('compositionend', () => { this.composition = false; this.callback([]); }, false);
    this.middleware = [];

    this.use(this.BEFORE_BUILTINS = this.updateUnknownRootNodes.bind(this));
    this.use(this.updateRootLevelClasslessDivs.bind(this));
    this.use(this.updateNewlineParagraphs.bind(this));
    this.use(this.updateMeaninglessLineBreaks.bind(this));
    this.use(this.updateUnwrappedElements.bind(this));
    this.use(this.updateEmptyNonVoidInlineElements.bind(this));
    this.use(this.updateEmptyNonVoidBlockElements.bind(this));
    this.use(this.updateNestedFormatting.bind(this));
    this.use(this.updateAdjacentFormatting.bind(this));
    this.use(this.updateListWrappedParagraphs.bind(this));
    this.use(this.updateMisplacedRootElements.bind(this));
    this.use(this.updateReferencesWithContent.bind(this));
    this.use(this.updateJoinHints.bind(this));
    this.use(this.AFTER_BUILTINS = this.updateEmptyEditor.bind(this));

    this.start();
  }

  /**
   * Add a new normalization to the normalizer
   */

  public use(middleware: (root: HTMLElement, subtree: HTMLElement, context?: string) => void, ref?: (root: HTMLElement, subtree: HTMLElement, context?: string) => void) {
    if (!ref) {
      this.middleware.push(middleware);
    } else {
      var index = this.middleware.indexOf(ref);
      if (index == -1) {
        this.middleware.push(middleware);
      } else {
        this.middleware.splice(index, 0, middleware);
      }
    }
  }

  /**
   * Force a normalization of the editor content
   */

  public normalize(context: string, root: HTMLElement = this.editor.el, subtree: HTMLElement = root) {

    this.middleware.forEach((middleware) => {
      middleware(root, subtree, context);
    });

    if (hacks.storeSelectionForTextNodeChanges) {
      var s = currentSelection(document);
      var r = currentRange(s);

      if (r && !r['intersectsNode'](subtree)) {
        r = null;
      }
    }

    subtree.normalize(); // dom subtree normalization

    if (r) {
      s.removeAllRanges();
      s.addRange(r);
    }
  }

  /**
   * Starts the mutation observer
   */

  private start(): void {
    this.observer.observe(this.editor.el, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });
  }

  /**
   * Stops the mutation observer
   */

  private stop(): void {
    this.observer.disconnect();
  }

  /**
   * Fired whenever mutations occur in the observed DOM node
   */

  private callback(records: MutationRecordList): void {
    if (this.composition) return debug('ignoring, since composition=%o', this.composition);
    debug('normalizing %d mutation records', records.length);

    this.stop(); // pause the observer so that we don't react to our own changes

    this.editor.transactions.runAndSquash(() => {
      this.normalize('mutation');
    });

    // TODO: move overlay updating to it's own thing,
    // it doesn't really belong here but needs extra logic
    // to not fight with the normalizations if placed elsewhere
    this.updateOverlay(null, null);


    this.start(); // resume the observer
  }

  /**
   * Make sure that the editor is initialized with at least one
   * paragraph to allow input
   */

  private updateEmptyEditor(root: HTMLElement, subtree: HTMLElement): void {
    if (!root.firstElementChild) {
      var p = document.createElement('p');
      var br = document.createElement('br');
      p.appendChild(br);
      root.appendChild(p);
    }
  }

  /**
   * Wraps unknown root nodes in p tags
   */

  private updateUnknownRootNodes(root: HTMLElement, subtree: HTMLElement): void {
    var nodes = root.childNodes;
    var el: HTMLElement = null; // a wrapper for moving the elements into, lazily created
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      // check if the node is not an element, or if it's not one of the valid root elements
      if ((node.nodeType != Node.ELEMENT_NODE) || !matches(<HTMLElement>node, ROOT_ELEMENTS)) {
        var wrappers: string[];
        // check if the element requires a specialized wrapper element
        if ((wrappers = WRAPPER_ELEMENTS[node.nodeName])) {
          if (!el || el.nodeName != wrappers[0]) {
            // created if no wrapper exists, or if we need a different one
            el = document.createElement(wrappers[0]);
          } else {
            i--; // look again at the same index, since an element will be removed
          }
        } else {
          if (!el) {
            el = document.createElement('div'); // fallback to a div, which will be processed later at updateRootLevelClasslessDivs
          } else {
            i--; // look again at the same index, since an element will be removed
          }
        }
        root.insertBefore(el, node);
        el.appendChild(node); // element is moved into wrapper that we created
        // also reset on 'BR' so that multiple lines of text are added to different DIVs
        if (node.nodeName == 'BR') {
          el = null;
        }
      } else {
        // reset to make sure we create another wrapper next time
        el = null;
      }
    }
  }

  /**
   * Makes sure classless divs at the root level are converted to paragraphs
   */

  private updateRootLevelClasslessDivs(root: HTMLElement, subtree: HTMLElement): void {
    var nodes = root.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeName == 'DIV' && !(<HTMLElement>node).className) {
        var p = document.createElement('p');
        while (node && node.nodeName == 'DIV' && !(<HTMLElement>node).className) {
          var isBreak = (node.childNodes.length == 1) && node.childNodes[0].nodeName == 'BR';
          if (!isBreak) {
            move(<HTMLElement> node, p);
            if (!p.lastChild || p.lastChild.nodeName != 'BR') {
              p.appendChild(document.createElement('br'));
            }
          }
          var tmp = node;
          node = node.nextSibling;
          root.removeChild(tmp);
          if (isBreak) {
            if (p.childNodes.length == 0) {
              p.appendChild(tmp.firstChild);
            }
            break;
          }
        }
        root.insertBefore(p, node);
      }
    }
  }

  /**
   * Wrap elements that require special wrapping
   */

  private updateUnwrappedElements(root: HTMLElement, subtree: HTMLElement): void {
    var q = Object.keys(WRAPPER_ELEMENTS).join(', ');
    var els = query.all(q, subtree);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (WRAPPER_ELEMENTS[el.nodeName].indexOf(el.parentNode.nodeName) == -1) {
        var tmp = document.createElement(WRAPPER_ELEMENTS[el.nodeName][0]);
        el.parentNode.insertBefore(tmp, el)
        tmp.appendChild(el);
      }
    }
  }

  /**
   * Wrap elements that require special wrapping
   */

  private updateNestedFormatting(root: HTMLElement, subtree: HTMLElement): void {
    var els = query.all(NESTED_FORMATTING_ELEMENTS, subtree);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var content = move(el);
      el.parentNode.replaceChild(content, el);
    }
  }

  /**
   * Join elements that are touching each other
   */

  private updateAdjacentFormatting(root: HTMLElement, subtree: HTMLElement): void {
    var els = query.all(ADJACENT_FORMATTING_ELEMENTS, subtree);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var previous = <HTMLElement>el.previousSibling;
      // sanity and attribute checks
      if (previous && previous.nodeName == el.nodeName && this.checkSameAttributes(el, previous)) {
        move(el, previous);
        el.parentNode.removeChild(el);
      }
    }
  }

  private checkSameAttributes(a: HTMLElement, b: HTMLElement): boolean {
    var attrs = a.attributes;
    if (attrs.length != b.attributes.length) return false;
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (b.getAttribute(attr.name) != attr.value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Normalize `li > p` into just `li`.
   */

  private updateListWrappedParagraphs(root: HTMLElement, subtree: HTMLElement): void {
    var els = query.all('li > p', subtree);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var fragment = move(el);
      el.parentNode.replaceChild(fragment, el);
    }
  }

  /**
   * Move misplaced root level elements
   */

  private updateMisplacedRootElements(root: HTMLElement, subtree: HTMLElement): void {
    var ready = false;
    while (!ready) {
      ready = true;
      var els = query.all(ROOT_ELEMENTS, subtree);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.parentNode != root) {
          if (el.parentNode.nodeName == 'BLOCKQUOTE') {
            continue;
          }
          if ((el.nodeName == 'UL' || el.nodeName == 'OL') && (el.parentNode.nodeName == 'UL' || el.parentNode.nodeName == 'OL')) {
            continue;
          }
          var wrapper = el.parentNode;
          while (wrapper && wrapper.parentNode != root) {
            wrapper = wrapper.parentNode;
          }
          if (!wrapper) {
            ready = false;
            continue;
          }
          var middle = document.createRange();
          middle.selectNode(el);
          var left = document.createRange();
          left.selectNode(wrapper);
          left.setEnd(middle.startContainer, middle.startOffset);
          var right = document.createRange();
          right.selectNode(wrapper);
          right.setStart(middle.endContainer, middle.endOffset);
          root.insertBefore(left.cloneContents(), wrapper);
          root.insertBefore(middle.cloneContents(), wrapper);
          root.insertBefore(right.cloneContents(), wrapper);
          root.removeChild(wrapper);
          ready = false;
        }
      }
    }
  }

  /**
   * Update the editor overlay
   */

  private updateOverlay(root: HTMLElement, subtree: HTMLElement): void {
    this.editor.overlay.update();
  }

  /**
   * Delete empty root elements
   */

  private updateEmptyNonVoidBlockElements(root: HTMLElement, subtree: HTMLElement): void {
    var changed;
    do {
      changed = false;
      // TODO: make non global
      var res: HTMLElement[] = query.all(NON_VOID_BLOCK_ELEMENTS + ', li', root);
      for (var i = 0; i < res.length; i++) {
        var re = res[i];
        if (!re.firstChild) {
          changed = true;
          re.parentNode.removeChild(re);
        }
      }
    } while (changed);
  }

  /**
   * Delete empty inline, non-void elements
   */

  private updateEmptyNonVoidInlineElements(root: HTMLElement, subtree: HTMLElement): void {
    var changed;
    do {
      changed = false;
      var els: HTMLElement[] = query.all(NON_VOID_INLINE_ELEMENTS, subtree);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var empty = !el.firstChild || ((el.firstChild == el.lastChild) && (el.firstChild.nodeType == Node.TEXT_NODE) && (el.firstChild.nodeValue == ''));
        if (empty && el.className != 'join-hint' && el.className != 'tmp') {
          el.parentNode.removeChild(el);
        }
      }
    } while (changed);
  }

  /**
   * Transforms paragraphs with newline characters into
   * paragraphs with BR tags.
   */

  private updateNewlineParagraphs(root: HTMLElement, subtree: HTMLElement): void {
    // TODO: make non global
    var ps: HTMLElement[] = query.all('p', root);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (1 == p.childNodes.length && is.newline(p.firstChild)) {
        p.removeChild(p.firstChild);
        p.appendChild(document.createElement('br'));
      }
    }
  }

  /**
   * Removes all line breaks are at the end of their containers
   */

  private updateMeaninglessLineBreaks(root: HTMLElement, subtree: HTMLElement): void {
    var brs: HTMLElement[] = query.all('br', subtree);
    for (var i = 0; i < brs.length; i++) {
      var br = brs[i];
      if ((!br.nextSibling) && br.previousSibling && br.previousSibling.nodeName != 'BR') {
        br.parentNode.removeChild(br);
      }
    }
  }

  /**
   * Detects overlay references with content and moves their
   * contents to a new paragraph. (So that if an overlay reference
   * is focused, and the user types something, it shows up
   * next to it.)
   */

  private updateReferencesWithContent(root: HTMLElement, subtree: HTMLElement): void {
    // TODO: make non global
    var refs: HTMLElement[] = query.all('.overlay-reference', root);
    for (var i = 0; i < refs.length; i++) {
      var ref = refs[i];
      if (!is.emptyOverlayReference(ref)) {
        // remove placeholder br. due to content editable differences
        // this node magically disappears on Chrome and Safari, but is
        // still present on Firefox. (I'm with Firefox on this one...)
        if (ref.lastChild.nodeName === 'BR') {
          ref.removeChild(ref.lastChild);
        } else if (ref.firstChild.nodeName === 'BR') {
          ref.removeChild(ref.firstChild);
        }

        // extract overlay reference contents to an adjacent paragraph
        var p = document.createElement('p');
        while (ref.firstChild) {
          p.appendChild(ref.firstChild);
        }
        ref.parentNode.insertBefore(p, ref.nextSibling);

        // restore the placeholder br inside the overlay reference
        var br = document.createElement('br');
        ref.appendChild(br);

        // place cursor on the end of the newly created paragraph
        var selection = currentSelection(document);
        var range = document.createRange();
        range.selectNodeContents(p);
        selection.removeAllRanges();
        selection.addRange(range);
        collapse.toEnd(selection);
      }
    }
  }

  /**
   * Joins together paragraphs with matching join hints, and
   * deletes invalid hints.
   */

  private updateJoinHints(root: HTMLElement, subtree: HTMLElement): void {
    // TODO: make non global
    var hints: HTMLElement[] = query.all('span.join-hint', root);
    for (var i = 0; i < hints.length; i++) {
      var hint = hints[i];
      var parent = hint.parentNode;
      if (!parent) {
        // hint has been orphaned by merging with other hint
        // ignore it
      } else if (hint == parent.lastChild) {
        // hint in the end of paragraph
        var next = parent.nextSibling;
        if (!next) {
          // no next node, remove the hint
          parent.removeChild(hint);
        } else if (next.nodeType == Node.ELEMENT_NODE) {
          // next node is an element
          if (matches(<HTMLElement>next, '.overlay-reference')) {
            // ignore overlay references
          } else {
            if (is.joinHint(next.firstChild)) {
              // found another matching hint, merge paragraphs
              parent.removeChild(hint);
              next.removeChild(next.firstChild);
              while (next.childNodes.length) {
                parent.appendChild(next.firstChild);
              }
              next.parentNode.removeChild(next);
            } else {
              // a matching hint was not found, remove the current hint
              parent.removeChild(hint);
            }
          }
        } else {
          // next node is not an element, ignore it
        }
      } else if (hint == parent.firstChild) {
        // hint in the beginning of paragraph
        var prev = parent.previousSibling;
        if (!prev) {
          // no prev node, remove the hint
          parent.removeChild(hint);
        } else if (prev.nodeType == Node.ELEMENT_NODE) {
          // prev node is an element
          if (matches(<HTMLElement>prev, '.overlay-reference')) {
            // ignore overlay references
          } else {
            if (is.joinHint(prev.lastChild)) {
              // ignore this case, as merging is done on the other side
            } else {
              // a matching hint was not found, remove the current hint
              parent.removeChild(hint);
            }
          }
        } else {
          // ignore non element nodes
        }
      } else {
        // hint inside the paragraph, remove it
        parent.removeChild(hint);
      }
    }
  }
}

export = EditorNormalizer;

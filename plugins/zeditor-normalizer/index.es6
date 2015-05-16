/**
 * TypeScript imports
 */

var throttle = require('per-frame');
var MutationObserver = require('mutation-observer');
var query = require('component-query');
var currentRange = require('current-range');
var currentSelection = require('current-selection');
var matches = require('matches-selector');
var dataset = require('dataset');
var blockElements = require('block-elements');
var inlineElements = require('inline-elements');
var voidElements = require('void-elements');
var DEBUG = require('debug');
var move = require('dom-move');

var hacks = require('../../lib/hacks/index');
var is = require('zeditor-is');
var collapse = require('collapse');

var Zeditor = require('zeditor');

var plugin = require('zeditor-plugin');

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
 * Normalizes the content of the editor
 */

class EditorNormalizer {

  constructor(node) {
    this.editor = Zeditor(node);
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

  use(middleware, ref) {
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

  normalize(context, root = this.editor.el, subtree = root) {

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

  start() {
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

  stop() {
    this.observer.disconnect();
  }

  /**
   * Fired whenever mutations occur in the observed DOM node
   */

  callback(records) {
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

  updateEmptyEditor(root, subtree) {
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

  updateUnknownRootNodes(root, subtree) {
    var nodes = root.childNodes;
    var el = null; // a wrapper for moving the elements into, lazily created
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      // check if the node is not an element, or if it's not one of the valid root elements
      if ((node.nodeType != Node.ELEMENT_NODE) || !matches(node, ROOT_ELEMENTS)) {
        var wrappers;
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

  updateRootLevelClasslessDivs(root, subtree) {
    var nodes = root.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeName == 'DIV' && !(node).className) {
        var p = document.createElement('p');
        while (node && node.nodeName == 'DIV' && !(node).className) {
          var isBreak = (node.childNodes.length == 1) && node.childNodes[0].nodeName == 'BR';
          if (!isBreak) {
            move(node, p);
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

  updateUnwrappedElements(root, subtree) {
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

  updateNestedFormatting(root, subtree) {
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

  updateAdjacentFormatting(root, subtree) {
    var els = query.all(ADJACENT_FORMATTING_ELEMENTS, subtree);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var previous = el.previousSibling;
      // sanity and attribute checks
      if (previous && previous.nodeName == el.nodeName && this.checkSameAttributes(el, previous)) {
        move(el, previous);
        el.parentNode.removeChild(el);
      }
    }
  }

  checkSameAttributes(a, b) {
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

  updateListWrappedParagraphs(root, subtree) {
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

  updateMisplacedRootElements(root, subtree) {
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

  updateOverlay(root, subtree) {
    this.editor.overlay.update();
  }

  /**
   * Delete empty root elements
   */

  updateEmptyNonVoidBlockElements(root, subtree) {
    var changed;
    do {
      changed = false;
      // TODO: make non global
      var res = query.all(NON_VOID_BLOCK_ELEMENTS + ', li', root);
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

  updateEmptyNonVoidInlineElements(root, subtree) {
    var changed;
    do {
      changed = false;
      var els = query.all(NON_VOID_INLINE_ELEMENTS, subtree);
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

  updateNewlineParagraphs(root, subtree) {
    // TODO: make non global
    var ps = query.all('p', root);
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

  updateMeaninglessLineBreaks(root, subtree) {
    var brs = query.all('br', subtree);
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

  updateReferencesWithContent(root, subtree) {
    // TODO: make non global
    var refs = query.all('.overlay-reference', root);
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

  updateJoinHints(root, subtree) {
    // TODO: make non global
    var hints = query.all('span.join-hint', root);
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
          if (matches(next, '.overlay-reference')) {
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
          if (matches(prev, '.overlay-reference')) {
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

module.exports = plugin(EditorNormalizer);

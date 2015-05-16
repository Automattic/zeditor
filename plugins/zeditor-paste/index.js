/**
 * Module Dependencies
 */

var Zeditor = require('zeditor');
var plugin = require('zeditor-plugin');

var htmlpipe = require('html-pipe');
var toArray = require('to-array');
var classes = require('component-classes');
var tmp = require('tmp-el');
var domPaste = require('dom-paste');
var currentRange = require('current-range');
var currentSelection = require('current-selection');
var insertNode = require('range-insert-node');
var query = require('component-query');
var move = require('dom-move');

var HTMLBlock = require('../../lib/block-html');
var is = require('../../lib/is');
var insertPastedContent = require('./insert');

/**
 * Expose pasted
 */

module.exports = plugin(ZeditorPaste);

/**
 * Pasted editor plugin
 */

function ZeditorPaste(node) {
  Zeditor(node).el.addEventListener('paste', onPaste, false);
  Zeditor(node).normalizer.use(normalizePaste, Zeditor(node).normalizer.BEFORE_BUILTINS);
}

function onPaste(e) {
  // parse and sanitize the text
  domPaste(e, function(content) {
    if (!content) return;

    // hook for plugins to inspect/alter "paste" content before insertion
    editor.emit('paste', content);
    editor.normalizer.normalize('paste', content);

    var fragment = move(content);
    var selection = currentSelection(editor.el);
    var range = currentRange(selection);
    var end = fragment.lastChild;

    var joinHint = document.createElement('span');
    joinHint.className = 'tmp';
    joinHint.innerHTML = '';
    end.appendChild(joinHint);

    // inject the content into the editor
    editor.transactions.run(function() {
      // remove selected content (if any)
      range.deleteContents();

      insertPastedContent(editor.el, fragment, range);
    });

    // implicitly called here by the mutation observer:
    // editor.normalizer.normalize();

    editor.transactions.runAndSquash(function() {
      // place collapsed cursor after content
      range.selectNode(query('.tmp', editor.el));
      range.deleteContents();
      range.collapse(false);

      // add range to selection
      selection.removeAllRanges();
      selection.addRange(range);
    });
  });
}

function normalizePaste(root, subtree, context) {
  if (context != 'paste') return;

  checkForSingleA(root);

  console.log(root.innerHTML);

  htmlpipe(root)
    .pipe(replaceElements('CITE'))
    .pipe(removeMSOEmptyParagraphs())
    .pipe(detectMSOQuotes())
    .pipe(detectMSOLists())
    .pipe(convertMSOMarginToPadding())
    .pipe(unwrapElements('SPAN', 'FONT'))
    .pipe(allowedStyles('text-align', 'padding-left'))
    .pipe(normalizeInlineElements())
    .run();

  htmlpipe(root)
    .pipe(normalizeWhitespace())
    .pipe(removeComments())
    .run();

  htmlpipe(root)
    .pipe(joinMSOLists())
    .pipe(allowedElements(editor, 'A', 'STRONG', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'DIV', 'U', 'EM', 'I', 'SUP', 'SUB',
          'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
          'STRIKE', 'P', 'FONT', 'OL', 'UL', 'LI'))
    .pipe(allowedAttrs('style', 'type', 'href'))
    .run();
}

function checkForSingleA(root) {
  // Safari will paste URLs from other sources as a single "A" element.
  // We check for this pattern and transform it into the text content to
  // allow easy embedding.
  if (root.firstChild &&
      root.firstChild == root.lastChild &&
      root.firstChild.nodeName == 'A' &&
      root.firstChild.firstChild &&
      root.firstChild.firstChild == root.firstChild.lastChild &&
      root.firstChild.firstChild.nodeType == Node.TEXT_NODE &&
      root.firstChild.href == root.firstChild.firstChild.nodeValue) {
    root.replaceChild(root.firstChild.firstChild, root.firstChild);
  }
}

function normalizeInlineElements() {
  return function(el) {
    var tmpEl;
    if (el.nodeName == 'STRIKE' || el.nodeName == 'S') {
      tmpEl = document.createElement('del');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
      return false;
    } else if (el.nodeName == 'B') {
      tmpEl = document.createElement('strong');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
      return false;
    } else if (el.nodeName == 'I') {
      tmpEl = document.createElement('em');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
      return false;
    }
  }
}

function removeMSOEmptyParagraphs() {
  return function(el) {
    if (el.nodeName == 'P' && el.className.match(/^MsoNormal/)) {
      if (el.childNodes.length == 1) {
        if (el.firstChild.nodeName == 'O:P' &&
            el.firstChild.childNodes.length == 1 &&
            el.firstChild.firstChild.nodeType == Node.TEXT_NODE &&
            el.firstChild.firstChild.nodeValue == '\u00A0' /* &nbsp; */) {
          return null;
        }
        if (el.firstChild.nodeType == Node.TEXT_NODE &&
            el.firstChild.nodeValue == '\u00A0' /* &nbsp; */) {
          return null;
        }
      }
    }
  }
}

function detectMSOQuotes() {
  return function(el) {
    if (el.nodeName == 'P' && el.className.match(/^Mso(Intense)?Quote/)) {
      var blockquote = document.createElement('blockquote');
      var p = document.createElement('p');
      while (el.firstChild) {
        p.appendChild(el.firstChild);
      }
      blockquote.appendChild(p);
      el.appendChild(blockquote);
      return false;
    }
  }
}

function detectMSOLists() {
  return function(el) {
    var placeholder = '';
    var listEl;
    var listType;
    if (el.nodeName == 'P' && el.className.match(/^MsoList/)) {
      var style = el.getAttribute('style') || '';
      var msoListInfo = style.match(/mso\-list\:\s*l([A-Za-z0-9]+)\s+level([A-Za-z0-9]+)\s+lfo([A-Za-z0-9]+)\;?/);
      if (el.firstChild && el.firstChild.nodeType == Node.COMMENT_NODE && el.firstChild.nodeValue == '[if !supportLists]') {
        while (el.childNodes[1] && el.childNodes[1].nodeType != Node.COMMENT_NODE) {
          placeholder += el.childNodes[1].textContent;
          if (el.childNodes[1].nodeType == Node.ELEMENT_NODE) {
            if (el.childNodes[1].style['font-family'].match(/(\"|\')?Symbol|Wingdings|Courier New(\"|\')?/)) {
              listEl = 'ul';
            }
          }
          el.removeChild(el.childNodes[1]);
        }
      } else if (el.firstChild && el.firstChild.nodeType == Node.ELEMENT_NODE) {
        placeholder = el.firstChild.textContent;
        if (el.firstChild.style['font-family'].match(/(\"|\')?Symbol|Wingdings|Courier New(\"|\')?/)) {
          listEl = 'ul';
        }
        el.removeChild(el.firstChild);
      } else {
        el.setAttribute('data-mso-list', 'separator');
        return;
      }
      if (!listEl) {
        placeholder = placeholder.replace(/\s+/g, '');
        if (placeholder.match(/^[0-9]/)) {
          listEl = 'ol';
          listType = '1';
        } else if (placeholder.match(/^[ivx]/)) {
          listEl = 'ol';
          listType = 'i';
        } else if (placeholder.match(/^[IVX]/)) {
          listEl = 'ol';
          listType = 'I';
        } else if (placeholder.match(/^[a-z]/)) {
          listEl = 'ol';
          listType = 'a';
        } else if (placeholder.match(/^[A-Z]/)) {
          listEl = 'ol';
          listType = 'A';
        } else {
          listEl = 'ul';
        }
      }
      var li = move(el, document.createElement('li'));
      var ul = document.createElement(listEl);
      ul.setAttribute('data-mso-list', 'item');
      ul.appendChild(li);
      if (listType) {
        ul.type = listType;
      }
      if (msoListInfo) {
        for (var level = 1; level < (+msoListInfo[2] || 1); level++) {
          var tmp = document.createElement(listEl);
          tmp.appendChild(ul);
          ul = tmp;
          ul.setAttribute('data-mso-list', 'nest');
        }
      }
      el.appendChild(ul);
      return false;
    }
  }
}

function joinMSOLists() {
  return function(el) {
    if (el.nodeType != Node.ELEMENT_NODE) {
      return;
    }
    if (el.getAttribute('data-mso-list') == 'item') {
      for (;;) {
        if (!el.nextElementSibling) break;

        var msoList = el.nextElementSibling.getAttribute('data-mso-list');

        if (msoList == 'item') {
          if (el.nodeName == el.nextElementSibling.nodeName) {
            if (el.type == el.nextElementSibling.type || 
              ((el.type == 'A' || el.type == 'a') && (el.nextElementSibling.type == 'I' || el.nextElementSibling.type == 'i')) ||
              ((el.type == 'I' || el.type == 'i') && (el.nextElementSibling.type == 'A' || el.nextElementSibling.type == 'a'))) {
              move(el.nextElementSibling, el);
              el.parentNode.removeChild(el.nextElementSibling);
            } else {
              break;
            }
          } else {
            break;
          }
        } else if (msoList == 'nest') {
          move(el.nextElementSibling, el);
          el.parentNode.removeChild(el.nextElementSibling);
        } else {
          break;
        }
      }
    } else if (el.getAttribute('data-mso-list') == 'separator') {
      return null;
    }
  }
}

function convertMSOMarginToPadding() {
  return function(el) {
    if (el.nodeName != 'P') {
      return;
    }
    if (!el.className.match(/^Mso.+/)) {
      return;
    }
    if (el.style.paddingLeft) {
      return;
    }
    var marginLeft = parseInt(el.style.marginLeft, 10);
    // TODO: read the increment value from the PaddingCommand. We assume 30 here
    var paddingLeft = Math.round(marginLeft / 36.0) * 30;
    el.style.paddingLeft = paddingLeft + 'px';
  }
}

function replaceElements() {
  var args = toArray(arguments);

  return function(el) {
    var replace = ~args.indexOf(el.nodeName);
    if (!replace) return;
    var tmpEl = document.createElement('p');
    while (el.firstChild) {
      tmpEl.appendChild(el.firstChild);
    }
    el.appendChild(tmpEl);
    return false;
  }
}

/**
 * Unwrap elements
 *
 * @return {Function} fn
 */

function unwrapElements() {
  var args = toArray(arguments);

  return function(el) {
    var unwrap = ~args.indexOf(el.nodeName);
    if (!unwrap) return;
    var tmpEl;
    var computedStyle = window.getComputedStyle(el, null);
    var weight = computedStyle.fontWeight;
    var style = computedStyle.fontStyle;
    var family = computedStyle.fontFamily;
    var decoration = computedStyle.textDecoration;
    if (weight == 'bold' ||
        weight == 'bolder' ||
        parseInt(weight) > 500) {
      tmpEl = document.createElement('strong');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
    }
    if (style == 'italic' || style == 'oblique') {
      tmpEl = document.createElement('em');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
    }
    if (decoration == 'underline') {
      tmpEl = document.createElement('u');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
    }
    if (decoration == 'line-through') {
      tmpEl = document.createElement('del');
      while (el.firstChild) {
        tmpEl.appendChild(el.firstChild);
      }
      el.appendChild(tmpEl);
    }
    return false;
  };
}

function allowedStyles() {
  var names = toArray(arguments);
  return function (el) {
    if (el.nodeType != Node.ELEMENT_NODE) {
      return;
    }
    var tmp = {};
    for (var i = 0; i < names.length; i++) {
      name = names[i];
      tmp[name] = el.style[name];
    }
    el.removeAttribute('style');
    for (var i = 0; i < names.length; i++) {
      name = names[i];
      el.style[name] = tmp[name];
    }
  }
}
/**
 *
 */

function removeComments() {
  return function(node) {
    if (node.nodeType == Node.COMMENT_NODE) {
      return null;
    } 
  }
}

/**
 * Normalize whitespace of non pre-wrap text nodes
 *
 * @return {Function} fn
 */

function normalizeWhitespace() {
  return function(node) {

    if (node.nodeType != Node.TEXT_NODE) {
      return;
    }

    var computedStyle = window.getComputedStyle(node.parentNode, null);
    if (computedStyle.whiteSpace.match(/^pre.*/)) {
      return;
    }

    node.nodeValue = node.nodeValue.replace(/\r|\n|\r\n/g, ' ').replace(/[ \t]+/g, ' ');

    var inlineAfter = node.nextSibling &&
                      node.nextSibling.nodeType == Node.ELEMENT_NODE &&
                      window.getComputedStyle(node.nextSibling).display == 'inline' &&
                      node.nextSibling.nodeName != 'BR';

    var inlineBefore = node.previousSibling &&
                       node.previousSibling.nodeType == Node.ELEMENT_NODE &&
                       window.getComputedStyle(node.previousSibling).display == 'inline' &&
                       node.previousSibling.nodeName != 'BR';

    if (computedStyle.display != 'inline') {
      if (inlineAfter) {
        if (inlineBefore) {
          // don't replace
        } else {
          node.nodeValue = node.nodeValue.replace(/^[ \t]+/g, '');
        }
      } else {
        if (inlineBefore) {
          node.nodeValue = node.nodeValue.replace(/[ \t]+$/g, '');
        } else {
          node.nodeValue = node.nodeValue.replace(/^[ \t]+|[ \t]+$/g, '');
        }
      }
    }
  }
}

/**
 * Whitelisted elements
 *
 * @return {Function} fn
 */

function allowedElements() {
  var args = toArray(arguments);
  var editor = args.shift();

  return function(el) {
    if (is.overlayReference(el)) {
      return;
    }
    if (el.nodeType == Node.TEXT_NODE) {
      return;
    }
    if (args.indexOf(el.nodeName) == -1) {
      if (el.nodeName == 'TABLE') {
        var block = new HTMLBlock(el);
        block.bind(editor);
        return block.el;
      }
      if (el.nodeName == 'STYLE') {
        return null;
      }
      return false;
    }
  };
}

/**
 * Whitelisted attrs on element nodes
 *
 * @return {Function} fn
 */

function allowedAttrs() {
  var allowed = {};

  for (var i = 0; i < arguments.length; i++) {
    allowed[arguments[i]] = true;
  }

  return function(el) {
    if (el.nodeType != Node.ELEMENT_NODE) {
      return;
    }

    if (is.overlayReference(el)) {
      return;
    }

    var attrs = toArray(el.attributes);

    for (var i = 0; i < attrs.length; i++) {
      var name = attrs[i].name;
      if (!allowed[name]) {
        el.removeAttribute(name);
      }
    }
  };
}

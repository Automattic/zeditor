import Editor = require('../editor/index');
import currentRange = require('current-range');
import blockElements = require('block-elements');
import normalize = require('range-normalize');
import util = require('./util');

import DEBUG = require('debug');

var debug = DEBUG('editor:tokenizer:token');

class Token {

  public range: Range;
  public el: HTMLElement;
  public start: number;
  public end: number;
  public text: string;
  public type: string;
  public replacement: (token: Token, editor?: Editor) => Node;
  public exclusion: (token: Token, editor?: Editor) => Node;
  public pending: boolean
  public accessory: HTMLElement;

  /**
   * Token Flags
   */

  public excludeOnUnfocus: boolean = false;
  public excludeOnEsc: boolean = false;
  public replaceOnLoad: boolean = false;
  public replaceOnSpace: boolean = false;
  public replaceOnEnter: boolean = false;
  public replaceOnUnfocus: boolean = false;
  public invisible: boolean = false;

  public constructor(
    el: HTMLElement,
    text: string,
    index: number
  ) {
    this.el = el;
    this.start = index;
    this.end = index + text.length;
    this.text = text;
    this.type = '';
    this.replacement = null;
    this.pending = false;
    this.calculateRange();
  }

  /**
   * Checks whether two tokens are intersecting.
   */

  public intersects(that: Token): boolean {
    return (this.el == that.el) && (!((this.end <= that.start) || (that.end <= this.start)));
  }

  /**
   * Determines if a token supercedes another
   * intersecting token.
   *
   * It should only be called for tokens
   * that intersect. Calling it for non-intersecting tokens
   * results in undefined behavior.
   *
   * This function follows the "Maximal munch" rule for
   * tokens that start on the same position, and will otherwise
   * favor the token that starts earlier in the text.
   *
   * This function allows tokens to be produced "out of order"
   * but still produce consistent results, as if the parsing
   * had happened linearly like a traditional lexer.
   *
   * Example:
   *
   * ```
   *     Text:    F O O B A R
   *  Token A:    - - -
   *  Token B:        - - - -
   *  Token C:      - - -
   *  Token D:    - - - - - -
   * ```
   *
   *  A supersedes B and C
   *  B supersedes no tokens
   *  C supersedes B
   *  D supersedes A, B and C
   */

  public supersedes(that: Token): boolean {
    return (this.start < that.start) ||
           (this.start == that.start && this.end > that.end);
  }

  public calculateRange() {
    var iterator = document.createNodeIterator(this.el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
    var node;
    var position = 0;
    var length;

    this.range = document.createRange();

    while (node = iterator.nextNode()) {
      if (node.nodeType == Node.TEXT_NODE) {
        length = node.nodeValue.length;
        if (this.start >= position && this.start <= position + length) {
          this.range.setStart(node, this.start - position);
        }
        if (this.end >= position && this.end <= position + length) {
          this.range.setEnd(node, this.end - position);
        }
        position += length;
      } else if (node.nodeType == Node.ELEMENT_NODE) {
        // TODO: allow placing the range edge on elements
        if (node.nodeName == 'BR') {
          position += 1;
        } else if (node.nodeName == 'IMG') {
          position += util.extractAltValue(<HTMLImageElement>node).length;
        }
      }
    }
  }

  public focused(): boolean {
    var selectionRange = currentRange(document);
    if (!selectionRange) return false;
    normalize(selectionRange);
    return (selectionRange.collapsed &&
            this.range.compareBoundaryPoints(Range.START_TO_START, selectionRange) <= 0 &&
            this.range.compareBoundaryPoints(Range.END_TO_END, selectionRange) >= 0);
  }

  public replace(editor: Editor): Node {
    if (this.replacement) {
      var el = this.replacement(this, editor);
      if (el) {
        if (blockElements.indexOf(el.nodeName.toLowerCase()) != -1) {
          var ref = this.range.endContainer;
          do {
            if (ref.parentNode == editor.el) break;
          } while (ref = ref.parentNode);
          this.range.deleteContents();
          if (ref) {
            editor.el.insertBefore(el, ref.nextSibling);
          } else {
            this.range.insertNode(el);
          }
        } else {
          this.range.deleteContents();
          this.range.insertNode(el);
        }
        return el;
      }
    }
  }

  public exclude(editor: Editor): Node {
    if (this.exclusion) {
      var el = this.exclusion(this, editor);
      if (el) {
        if (blockElements.indexOf(el.nodeName.toLowerCase()) != -1) {
          throw new Error('exclusion function must not return a block element');
        } else {
          this.range.deleteContents();
          this.range.insertNode(el);
        }
        return el;
      }
    } else {
      var span = document.createElement('span');
      span.className = 'no-tokens';
      try {
        this.range.surroundContents(span);
      } catch (e) {
        debug('surroundContents() failed, falling back to manual node extraction/insertion');
        span.appendChild(this.range.extractContents())
        this.range.insertNode(span);
      }
      return el;
    }
  }

  public intersectsRange(range: Range): boolean {
    var before = this.range.compareBoundaryPoints(range.START_TO_END, range) <= 0;
    var after = this.range.compareBoundaryPoints(range.END_TO_START, range) >= 0;
    return !(before || after);
  }

  public intersectsNode(node: Node): boolean {
    var range = document.createRange();
    range.selectNode(node);
    return this.intersectsRange(range);
  }
}

export = Token;

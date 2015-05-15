/// <reference path="../../types.d.ts" />

/**
 * Global Imports
 */

import events = require('events');
import query = require('component-query');
import DEBUG = require('debug');
import currentSelection = require('current-selection');
import currentRange = require('current-range');
import collapse = require('collapse');
import dataset = require('dataset');


/**
 * Local Imports
 */

import Editor = require('../editor/index')
import Token = require('./token')
import TokenizerRenderer = require('./renderer');
import hacks = require('../hacks/index');
import is = require('../is/index');
import util = require('./util');

var debug = DEBUG('editor:tokenizer');

class Tokenizer extends events.EventEmitter {

  private editor: Editor;

  public renderer: TokenizerRenderer;
  public allotted: Token[];
  public updateTimer: any;

  public constructor(editor: Editor) {

    if (!(this instanceof Tokenizer)) {
      return new Tokenizer(editor);
    }

    super();

    this.allotted = [];
    this.editor = editor;
    this.renderer = new TokenizerRenderer(this);

    this.editor.on('contentchange', () => {
      this.requestUpdate();
    });

    this.editor.on('selectionchange', () => {
      if (!this.updateTimer) {
        this.renderer.render();
        this.handleSelectionChange();
      }
    });

    this.editor.on('reset', () => {
      this.update();
      this.handleLoad();
    });
  }

  public update(): void {

    this.allotted = [];

    this._update(this.editor.el);

    this.renderer.render();
    this.handleSelectionChange();
  }

  private _update(el: HTMLElement): void {
    var children = el.childNodes;
    var length = children.length;

    for (var i = 0; i < length; i++) {
      var child = children[i];
      if (is.list(child) || is.blockquote(child)) {
        this._update(<HTMLElement>child);
      } else {
        this.emit('update', child, util.extractTextContent(child));
      }
    }
  }

  public requestUpdate(): void {
    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        try {
          this.update();
        } finally {
          this.updateTimer = null;
        }
      }, 0);
    }
  }

  public createToken(el: HTMLElement, text: string, index: number): Token {
    return new Token(el, text, index);
  }

  public createAccessory(token: Token, leftHTML: string = null, rightHTML: string = null): HTMLElement {
    var accessory = document.createElement('div');
    accessory.className = 'token-accessory';
    if (leftHTML) {
      var left = document.createElement('div');
      left.className = 'left';
      left.innerHTML = leftHTML;
      accessory.appendChild(left);
    }
    if (rightHTML) {
      var right = document.createElement('div');
      right.className = 'right';
      right.innerHTML = rightHTML;
      accessory.appendChild(right);
    }
    accessory.addEventListener('click', (e) => {
      if ((<HTMLElement>e.target).className == 'replace') {
        this.editor.transactions.run(() => {
          var s = currentSelection(document);
          var r = document.createRange();
          var replacement = token.replace(this.editor);
          if (replacement) {
            r.selectNode(replacement);
            s.removeAllRanges();
            s.addRange(r);
            collapse.toEnd(s);
          }
        });
      }
      if ((<HTMLElement>e.target).className == 'exclude') {
        this.editor.transactions.run(() => {
          var s = currentSelection(document);
          var r = document.createRange();
          var replacement = token.exclude(this.editor);
          if (replacement) {
            r.selectNode(replacement);
            s.removeAllRanges();
            s.addRange(r);
            collapse.toEnd(s);
          }
        });
      }
      e.preventDefault();
    }, false);
    accessory.addEventListener('mousedown', (e) => {
      e.preventDefault();
    }, false);
    return accessory;
  }

  public add(token: Token): void {

    var exclusions = query.all('.no-tokens', token.el);
    for (var i = 0; i < exclusions.length; i++) {
      if (token.intersectsNode(exclusions[i])) {
        return;
      }
    }

    var intersecting = this.allotted.filter((allotted) => token.intersects(allotted));
    var superseding = intersecting.filter((intersected) => token.supersedes(intersected));

    if (superseding.length < intersecting.length) {
      // token is ignored, as there are tokens it intersects with
      // that it cannot supersede.
      return;
    }

    if (superseding.length > 0) {
      this.allotted = this.allotted.filter((allotted) => superseding.indexOf(allotted) == -1);
    }

    this.allotted.push(token);
  }

  public focused(): Token {
    var allotted = this.allotted;
    var length = allotted.length;
    for (var i = 0; i < length; i++) {
      if (allotted[i].focused()) {
        return allotted[i];
      }
    }
  }

  public handleEsc() {
    var allotted = this.allotted;
    var length = allotted.length;
    for (var i = 0; i < length; i++) {
      if (allotted[i].focused() && (allotted[i].excludeOnEsc)) {
        this.editor.transactions.run(() => {
          var s = currentSelection(document);
          var r = document.createRange();
          var replacement = allotted[i].exclude(this.editor);
          if (replacement) {
            if (hacks.addSpaceOnEOLTokenDismiss) {
              if (!replacement.nextSibling ||
                  (replacement.nextSibling.nodeType == Node.TEXT_NODE && replacement.nextSibling.nodeValue == '')) {
                var space = document.createTextNode(' ');
                replacement.parentNode.insertBefore(space, replacement.nextSibling);
              }
            }
            r.selectNode(replacement);
            s.removeAllRanges();
            s.addRange(r);
            collapse.toEnd(s);
          }
        });
        return true;
      }
    }
    return false;
  }

  public handleEnter(): boolean {
    var allotted = this.allotted;
    var length = allotted.length;
    for (var i = 0; i < length; i++) {
      if (allotted[i].focused() && (allotted[i].replaceOnEnter)) {
        this.editor.transactions.run(() => {
          var s = currentSelection(document);
          var r = document.createRange();
          var replacement = allotted[i].replace(this.editor);
          if (replacement) {
            r.selectNode(replacement);
            s.removeAllRanges();
            s.addRange(r);
            collapse.toEnd(s);
          }
        });
        return true;
      }
    }
    return false;
  }

  public handleSelectionChange() {
    var allotted = this.allotted;
    var length = allotted.length;
    var s = currentSelection(document);
    if (!s.isCollapsed) return;
    for (var i = 0; i < length; i++) {
      if (allotted[i].excludeOnUnfocus && !allotted[i].focused()) {
        this.editor.transactions.runAndSquash(() => {
          if (hacks.storeSelectionForTextNodeChanges) {
            var r = currentRange(s);
          }
          allotted[i].exclude(this.editor);
          if (r) {
            s.removeAllRanges();
            s.addRange(r);
          }
        });
      } else if (allotted[i].replaceOnUnfocus && !allotted[i].focused()) {
        this.editor.transactions.runAndSquash(() => {
          if (hacks.storeSelectionForTextNodeChanges) {
            var r = currentRange(s);
          }
          allotted[i].replace(this.editor);
          if (r) {
            s.removeAllRanges();
            s.addRange(r);
          }
        });
      }
    }
  }

  public handleLoad() {
    var allotted = this.allotted;
    var length = allotted.length;
    this.editor.transactions.runAndSquash(() => {
      for (var i = 0; i < length; i++) {
        if (allotted[i].replaceOnLoad) {
          this.editor.transactions.runAndSquash(() => {
            allotted[i].replace(this.editor);
          });
        }
      }
    });
  }
}

export = Tokenizer;

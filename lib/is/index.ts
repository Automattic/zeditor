/// <reference path="../../types.d.ts" />

import classes = require('component-classes');
import matches = require('matches-selector');

var is = {
  text: function(el: Node): boolean {
    return el &&
           el.nodeType == Node.TEXT_NODE;
  },

  element: function(el: Node): boolean {
    return el &&
           el.nodeType == Node.ELEMENT_NODE;
  },

  p: function(el: Node): boolean {
    return is.element(el) &&
           el.nodeName == 'P';
  },

  list: function(el: Node): boolean {
    return is.element(el) &&
           (el.nodeName == 'UL' || el.nodeName == 'OL');
  },

  listItem: function(el: Node): boolean {
    return is.element(el) &&
           el.nodeName == 'LI';
  },

  emptyListItem: function(el: Node): boolean {
    return is.listItem(el) &&
           el.childNodes.length == 1 &&
           el.childNodes[0].nodeName == 'BR';
  },

  blockquote: function(el: Node): boolean {
    return is.element(el) &&
           el.nodeName == 'BLOCKQUOTE';
  },

  overlayReference: function (el: Node): boolean {
    return is.element(el) && matches(<HTMLElement>el, 'div.overlay-reference[data-id]');
  },

  joinHint: function (el: Node): boolean {
    return is.element(el) && matches(<HTMLElement>el, 'span.join-hint[contenteditable=false]');
  },

  empty: function (el: Node): boolean {
    return el &&
           el.childNodes.length == 0;
  },

  nonEmpty: function(el: Node): boolean {
    return el &&
           el.childNodes.length > 0;
  },

  newline: function(el: Node): boolean {
    return is.text(el) &&
           (<Text>el).textContent == '\n';
  },

  emptyParagraph: function(el: Node): boolean {
    return el.nodeName === 'P' &&
           el.childNodes.length === 1 &&
           el.childNodes[0].nodeName === 'BR';
  },

  emptyOverlayReference: function(el: Node): boolean {
    return is.overlayReference(el) &&
           el.childNodes.length === 1 &&
           el.childNodes[0].nodeName === 'BR';
  }
}

export = is;

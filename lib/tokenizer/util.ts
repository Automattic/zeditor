/// <reference path="../../types.d.ts" />

import dataset = require('dataset');

export function extractAltValue(img: HTMLImageElement): string {
  var alt = dataset(img, 'tokenizerAlt');
  if (alt != null) {
    return alt;
  }
  alt = img.alt;
  if (alt != null) {
    return alt;
  }
  return '\t';
}

export function extractTextContent(root: Node): string {
  if (root.nodeType == Node.TEXT_NODE) {
    return root.nodeValue;
  }
  var iterator = root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
  var result = '';
  var node;
  while (node = iterator.nextNode()) {
    if (node.nodeType == Node.TEXT_NODE) {
      result += node.nodeValue;
    } else if (node.nodeType == Node.ELEMENT_NODE) {
      if (node.nodeName == 'BR') {
        result += '\n';
      } else if (node.nodeName == 'IMG') {
        result += extractAltValue(<HTMLImageElement>node);
      }
    }
  }
  return result;
}

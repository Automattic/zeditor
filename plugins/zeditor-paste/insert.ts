import move = require('dom-move');
import insert = require('range-insert-node');
import is = require('../../lib/is/index');
import split = require('split-at-range');

function insertPastedContent(container: HTMLElement, fragment: DocumentFragment, range: Range) {
  if (fragment.childNodes.length == 0) {
    return;
  }

  if (!range.collapsed) {
    return;
  }

  var current = range.startContainer;
  if (current == container) {
    current = container.childNodes[range.startOffset];
  } else {
    while (current && (current.parentNode != container)) {
      current = current.parentNode;
    }
  }

  if (!current) {
    return insertAtEnd(container, fragment);
  }

  if (current.nodeType != Node.ELEMENT_NODE) {
    throw new Error("Range inside unsupported node type.");
  }

  if (is.overlayReference(current)) {
    return insertAfter(container, <HTMLElement> current, fragment);
  }

  if (fragment.childNodes.length == 1) {
    return insertSingleElement(container, <HTMLElement> current, fragment, range);
  } else {
    return insertMultipleElements(container, <HTMLElement> current, fragment, range);
  }
}

function insertSingleElement(container: HTMLElement, current: HTMLElement, fragment: DocumentFragment, range: Range) {
  if ((fragment.firstChild.nodeName == 'P') || (fragment.firstChild.nodeName == current.nodeName)) {
    var content = move(<HTMLElement> fragment.firstChild);
    insert(range, content);
  } else {
    var parts = split(current, range);
    container.insertBefore(parts[0], current);
    container.insertBefore(fragment, current);
    container.insertBefore(parts[1], current);
    container.removeChild(current);
  }
}

function insertMultipleElements(container: HTMLElement, current: HTMLElement, fragment: DocumentFragment, range: Range) {
  var parts = split(current, range);
  if (parts[0].firstChild && (fragment.firstChild.nodeName == parts[0].firstChild.nodeName)) {
    var content = move(<HTMLElement> fragment.firstChild);
    fragment.removeChild(fragment.childNodes[0]);
    parts[0].firstChild.appendChild(content);
  }
  if (parts[1].firstChild && (fragment.lastChild.nodeName == parts[1].firstChild.nodeName)) {
    var content = move(<HTMLElement> fragment.lastChild);
    fragment.removeChild(fragment.lastChild);
    parts[1].firstChild.insertBefore(content, parts[1].firstChild.firstChild);
  }
  container.insertBefore(parts[0], current);
  container.insertBefore(fragment, current);
  container.insertBefore(parts[1], current);
  container.removeChild(current);
}

function insertAfter(container: HTMLElement, current: HTMLElement, fragment: DocumentFragment) {
  container.insertBefore(fragment, current.nextSibling);
}

function insertAtEnd(container: HTMLElement, fragment: DocumentFragment) {
  container.appendChild(fragment);
}

export = insertPastedContent;
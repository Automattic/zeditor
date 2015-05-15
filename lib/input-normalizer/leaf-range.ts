/**
 * Given a range, returns a range selecting roughly
 * the same content, but with start and end containers
 * on leaf DOM nodes.
 */

function leafRange(input: Range): Range {
  var sc = input.startContainer;
  var so = input.startOffset;
  var ec = input.endContainer;
  var eo = input.endOffset;
  var next;

  // nest range start
  while (sc.childNodes.length > 0) {
    if (so < sc.childNodes.length) {
      next = sc.childNodes[so];
      if (next.nodeType != Node.TEXT_NODE && next.childNodes.length == 0) {
        break;
      }
      sc = next;
      so = 0;
    } else {
      next = sc.lastChild;
      if (next.childNodes.length == 0) {
        break;
      }
      sc = next;
      if (next.nodeType != Node.TEXT_NODE && sc.nodeType == Node.TEXT_NODE) {
        so = sc.textContent.length;
      } else {
        so = sc.childNodes.length;
      }
    }
  }

  // nest range end
  while (ec.childNodes.length > 0) {
    if (eo < ec.childNodes.length) {
      next = ec.childNodes[eo];
      if (next.nodeType != Node.TEXT_NODE && next.childNodes.length == 0) {
        break;
      }
      ec = next;
      eo = 0;
    } else {
      next = ec.lastChild;
      if (next.nodeType != Node.TEXT_NODE && next.childNodes.length == 0) {
        break;
      }
      ec = next;
      if (ec.nodeType == Node.TEXT_NODE) {
        eo = ec.textContent.length;
      } else {
        eo = ec.childNodes.length;
      }
    }
  }

  if (sc.nodeType != Node.TEXT_NODE && sc.childNodes.length == 0) {
    so = 0;
    next = sc;
    sc = sc.parentNode;
    while (next = next.previousSibling) {
      so++;
    }
  }

  if (ec.nodeType != Node.TEXT_NODE && ec.childNodes.length == 0) {
    eo = 0;
    next = ec;
    ec = ec.parentNode;
    while (next = next.previousSibling) {
      eo++;
    }
  }

  var output = document.createRange();
  output.setStart(sc, so);
  output.setEnd(ec, eo);
  return output;
}

export = leafRange;

/// <reference path="../../types.d.ts" />

import domPath = require('dom-path');

class FrozenRange {
  private startPath: number[];
  private startOffset: number;
  private endPath: number[];
  private endOffset: number;

  constructor(range: Range, reference: Node) {
    this.startPath = domPath.relative(reference, range.startContainer);
    this.startOffset = range.startOffset;
    this.endPath = domPath.relative(reference, range.endContainer);
    this.endOffset = range.endOffset;
  }

  public thaw(reference: Node): Range {
    var startContainer = domPath.resolve(reference, this.startPath);
    var endContainer = domPath.resolve(reference, this.endPath);
    var range = reference.ownerDocument.createRange();
    range.setStart(startContainer, this.startOffset);
    range.setEnd(endContainer, this.endOffset);
    return range;
  }
}

export = FrozenRange;

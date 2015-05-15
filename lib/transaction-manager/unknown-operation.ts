/// <reference path="../../types.d.ts" />

import selection = require('current-selection');

import Operation = require('./operation');
import FrozenRange = require('frozen-range');

/**
 * Implements an unknown operation, in the most naive way possible:
 * by storing the entire document state before and after the operation.
 *
 * This class is meant to be used as a fallback when an exact operation
 * cannot be detected.
 */

class UnknownOperation implements Operation {
  private _before: HTMLElement;
  private _after: HTMLElement;
  private _beforeRange: FrozenRange;
  private _afterRange: FrozenRange;

  constructor(before: HTMLElement, beforeRange: FrozenRange, after: HTMLElement, afterRange: FrozenRange) {
    this._before = before;
    this._after = after;
    this._beforeRange = beforeRange;
    this._afterRange = afterRange;
  }

  public static composite(op1: UnknownOperation, op2: UnknownOperation): UnknownOperation {
    return new UnknownOperation(op1._before, op1._beforeRange, op2._after, op2._afterRange);
  }

  public undo(doc: HTMLElement): FrozenRange {
    doc.innerHTML = '';
    var before = this._before.cloneNode(true);
    while (before.firstChild) {
      doc.appendChild(before.firstChild);
    }
    return this._beforeRange;
  }

  public redo(doc: HTMLElement): FrozenRange {
    doc.innerHTML = '';
    var after = this._after.cloneNode(true);
    while (after.firstChild) {
      doc.appendChild(after.firstChild);
    }
    return this._afterRange;
  }
}

export = UnknownOperation;

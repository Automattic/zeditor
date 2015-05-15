import Operation = require('./operation');
import CompositeOperation = require('./composite-operation');
import FrozenRange = require('frozen-range');

/**
 * Stores a stack of operations for undo/redo purposes
 */

class OperationStack {

  private doc: HTMLElement;
  private stack: Operation[];
  private index: number;
  private max: number;

  /**
   * Constructs an operation stack for a given document
   */

  constructor(doc: HTMLElement, max: number = 100) {
    this.doc = doc;
    this.max = max;
    this.stack = [];
    this.index = 0;
  }

  /**
   * Adds the given operation to the operation stack,
   * pruning old entries if needed
   */

  public push(op: Operation): void {
    this.stack.splice(this.index, Number.MAX_VALUE, op)
    ++ this.index;
    while (this.index > this.max) {
      this.stack.shift();
      -- this.index;
    }
  }

  /**
   * Adds the given operation to the operation stack,
   * by combining it with the previous operation.
   */

  public squash(op: Operation): void {
    var prev = this.stack[this.index - 1];
    if (prev) {
      this.stack[this.index - 1] = new CompositeOperation(prev, op)
    } else {
      this.push(op); // push if no previous operation exists
    }
  }

  /**
   * Undoes an operation. Returns true if successful.
   */

  public undo(): FrozenRange {
    if (this.index == 0) throw new Error('Nothing to undo.');
    return this.stack[--this.index].undo(this.doc);
  }

  /**
   * Redoes an operation. Returns true if successful.
   */

  public redo(): FrozenRange {
    if (this.index == this.stack.length) throw new Error('Nothing to redo.');
    return this.stack[this.index++].redo(this.doc);
  }

  /**
   * Checks whether an undo operation can be performed
   */

  public canUndo(): boolean {
    if (this.index == 0) return false;
    return true;
  }

  /**
   * Checks whether a redo operation can be performed
   */

  public canRedo(): boolean {
    if (this.index == this.stack.length) return false;
    return true;
  }
}

export = OperationStack;

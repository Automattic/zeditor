import Operation = require('./operation');
import UnknownOperation = require('./unknown-operation');
import FrozenRange = require('frozen-range');

/**
 * Implements a composite of two operations.
 */

class CompositeOperation implements Operation {

  // Two operations. (General case)
  private op1: Operation;
  private op2: Operation;

  // Single operation. (For when composition is special cased)
  private op: Operation;

  /**
   * Creates the composite operation given two
   * Operations
   */

  constructor (op1: Operation, op2: Operation) {

    // Extract nested single operations from CompositeOperations
    if (op1 instanceof CompositeOperation && (<CompositeOperation>op1).op) {
      op1 = (<CompositeOperation>op1).op;
    }
    if (op2 instanceof CompositeOperation && (<CompositeOperation>op2).op) {
      op2 = (<CompositeOperation>op2).op;
    }
     
    // special case scenario where both operations are
    // unkown, so that we don't store useless intermediate
    // states when squashing transactions
    if (op1 instanceof UnknownOperation &&
        op2 instanceof UnknownOperation) {
      this.op = UnknownOperation.composite(<UnknownOperation>op1, <UnknownOperation>op2);
    } else {
      this.op1 = op1;
      this.op2 = op2;
    }
  }

  public undo(doc: HTMLElement): FrozenRange {
    if (this.op) {
      return this.op.undo(doc);
    } else {
      this.op2.undo(doc);
      return this.op1.undo(doc);
    }
  }

  public redo(doc: HTMLElement): FrozenRange {
    if (this.op) {
      return this.op.redo(doc);
    } else {
      this.op1.redo(doc);
      return this.op2.redo(doc);
    }
  }
}

export = CompositeOperation;

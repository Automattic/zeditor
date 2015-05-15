import FrozenRange = require('frozen-range');

/**
 * Represents a single operation on the history,
 * with undo and redo capabilities.
 */

interface Operation {
  undo(doc: HTMLElement): FrozenRange;
  redo(doc: HTMLElement): FrozenRange;
}

export = Operation;

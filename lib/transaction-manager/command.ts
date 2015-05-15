/// <reference path="../../types.d.ts" />

import Command = require('webmodules-command')
import TransactionManager = require('./index');
import currentSelection = require('current-selection');
import FrozenRange = require('frozen-range');

class TransactionManagerCommand implements Command {

  private tm: TransactionManager;
  private direction: number;
  private doc: HTMLElement;

  constructor (tm: TransactionManager, doc: HTMLElement, direction: number) {
    this.tm = tm;
    this.direction = direction;
    this.doc = doc;
  }

  public execute(range?: Range, value?: any): void {
    var rangePresent = range && (range instanceof Range);
    var fr: FrozenRange;
    if (this.direction == -1) {
      fr = this.tm.undo(!rangePresent);
    } else if (this.direction == 1) {
      fr = this.tm.redo(!rangePresent);
    }
    if (rangePresent && fr) {
      var r = fr.thaw(this.doc);
      range.setStart(r.startContainer, r.startOffset);
      range.setEnd(r.endContainer, r.endOffset);
    }
  }

  public queryState(): boolean {
    return false;
  }

  public queryEnabled(): boolean {
    if (this.direction == -1) {
      return this.tm.canUndo();
    } else if (this.direction == 1) {
      return this.tm.canRedo();
    }
  }
}

export = TransactionManagerCommand;

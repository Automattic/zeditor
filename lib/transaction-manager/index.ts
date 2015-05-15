/// <reference path="../../types.d.ts" />

import MutationObserver = require('mutation-observer');
import currentRange = require('current-range');
import currentSelection = require('current-selection');

import Editor = require('../editor/index');
import Operation = require('./operation');
import OperationStack = require('./operation-stack');
import UnknownOperation = require('./unknown-operation');
import TransactionManagerCommand = require('./command');
import FrozenRange = require('frozen-range');
import events = require('events');

function freezeRange(doc: Node): FrozenRange {
  var range = currentRange(document);
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(doc.firstChild || doc);
    range.collapse(true);
  };
  return new FrozenRange(range, doc);
}

class TransactionManager extends events.EventEmitter {

  private inTransaction: boolean;
  private doc: HTMLElement;
  private opstack: OperationStack;
  private lkg: HTMLElement; // last known good copy of the document
  private lkgRange: FrozenRange;
  private observer: MutationObserver;

  public undoCommand: TransactionManagerCommand;
  public redoCommand: TransactionManagerCommand;

  /**
   * Creates a TransactionManager instance, that automatically
   * detects changes to the document, and adds operations
   * to its stack.
   */

  constructor(doc: HTMLElement) {
    if (!(this instanceof TransactionManager)) return new TransactionManager(doc);

    super();

    this.doc = doc;
    this.opstack = new OperationStack(doc);
    this.lkg = <HTMLElement>doc.cloneNode(true);
    this.lkgRange = freezeRange(doc);
    this.inTransaction = false;
    this.undoCommand = new TransactionManagerCommand(this, doc,  -1);
    this.redoCommand = new TransactionManagerCommand(this, doc, +1);
    this.observer = new MutationObserver(this.callback.bind(this));
    
    document.addEventListener('selectionchange', this.selectionCallback.bind(this), false);

    this.start();
  }

  /**
   * Starts the mutation observer
   */

  private start(): void {
    this.observer.observe(this.doc, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true
    });
  }

  /**
   * Stops the mutation observer
   */

  private stop(): void {
    var records = this.observer.takeRecords();
    if (records.length > 0) {
      this.callback(records);
    }
    this.observer.disconnect();
  }

  /**
   * Fired whenever mutations are observed in the document
   */

  private callback(mutations: MutationRecord[]) {
    if (!this.changed()) {
      return; // nothing changed, no need to do anything
    }
    var current = <HTMLElement>this.doc.cloneNode(true);
    var currRange = freezeRange(this.doc);
    var op = new UnknownOperation(this.lkg, this.lkgRange, current, currRange);
    this.lkg = current;
    this.lkgRange = currRange;
    this.opstack.push(op);
    this.emit('contentchange');
  }

  /**
   * Fired whenever the selection changes
   */

  private selectionCallback() {
    if (this.changed()) {
      // Document has changed. Bail without storing the LKG range, since we 
      // need it to match the LKG state of the document, not the current state. 
      // The callback() function will take care of updating LKG range later.
      return;
    }
    this.lkgRange = freezeRange(this.doc);
  }

  /**
   * Undoes the last operation. Returns true on success.
   */

  public undo(updateRange: boolean = true): FrozenRange {
    this.stop();
    try {
      var result = this.opstack.undo();
      if (updateRange) {
        var sel = currentSelection(this.doc);
        sel.removeAllRanges();
        sel.addRange(result.thaw(this.doc));
      }
      this.lkg = <HTMLElement>this.doc.cloneNode(true);
      this.lkgRange = freezeRange(this.doc);
      this.emit('undo');
      this.emit('contentchange');
      return result;
    } catch (e) {
      this.rollback();
      throw e;
    } finally {
      this.start();
    }
  }

  /**
   * Redoes the last operation. Returns true on success.
   */

  public redo(updateRange: boolean = true): FrozenRange {
    this.stop();
    try {
      var result = this.opstack.redo();
      if (updateRange) {
        var sel = currentSelection(this.doc);
        sel.removeAllRanges();
        sel.addRange(result.thaw(this.doc));
      }
      this.lkg = <HTMLElement>this.doc.cloneNode(true);
      this.lkgRange = freezeRange(this.doc);
      this.emit('undo');
      this.emit('contentchange');
      return result;
    } catch (e) {
      this.rollback();
      throw e;
    } finally {
      this.start();
    }
  }

  /**
   * Checks whether an undo operation can be performed
   */

  public canUndo(): boolean {
    return this.opstack.canUndo();
  }

  /**
   * Checks whether a redo operation can be performed
   */

  public canRedo(): boolean {
    return this.opstack.canRedo();
  }
  
  /**
   * Checks whether the content has changed since Last Known Good
   */

  private changed(): boolean {
    var docNodes = this.doc.childNodes;
    var lkgNodes = this.lkg.childNodes;
    var length = docNodes.length;
    if (lkgNodes.length != length) {
      return true;
    }
    for (var i = 0; i < length; i++) {
      if (!docNodes[i].isEqualNode(lkgNodes[i])) return true;
    }
    return false;
  }

  /**
   * Runs the given function as a transaction.
   *
   * Each transaction will result in an individual entry on the
   * operation stack for undo/redo purposes.
   *
   * If the given function throws an exception, a rollback
   * is performed, and the previous state of the editor
   * is restored. The exception is rethrown for further handling.
   *
   * If the function returns an Operation instance,
   * that instance is added to the operation stack. Otherwise,
   * an operation is automatically created. Care must be taken
   * when returning an Operation to make sure it matches exactly
   * the transaction performed.
   */

  public run(fn: () => void);
  public run(fn: () => Operation) {
    return this._run(fn, false);
  }

  /**
   * Similar to run(), but also squashes history. Useful
   * for normalization operations.
   */

  public runAndSquash(fn: () => void);
  public runAndSquash(fn: () => Operation) {
    return this._run(fn, true);
  }

  /**
   * Common implementation shared by run() and runAndSquash()
   */

  private _run(fn: () => Operation, squash: boolean): void {
    if (this.inTransaction) {
      throw new Error('A transaction is already taking place.')
    }
    this.stop();
    this.inTransaction = true;
    try {
      var op = fn();
    } catch (e) {
      this.rollback();
      throw e;
    } finally {
      this.inTransaction = false;
      this.start();
    }
    var current;
    var currRange;
    if (!op) {
      if (!this.changed()) {
        return; // nothing changed, no need to do anything
      }
      current = <HTMLElement>this.doc.cloneNode(true);
      currRange = freezeRange(this.doc);
      op = new UnknownOperation(this.lkg, this.lkgRange, current, currRange);
    } else {
      current = <HTMLElement>this.doc.cloneNode(true);
      currRange = freezeRange(this.doc);
    }
    this.lkg = current;
    this.lkgRange = currRange;
    if (squash) {
      this.opstack.squash(op);
    } else {
      this.opstack.push(op);
    }

    this.emit('contentchange');
  }

  /**
   * Rollback editor to last known good state
   */

  private rollback(): void {
    var lkg = <HTMLElement>this.lkg.cloneNode(true);
    this.doc.innerHTML = '';
    while (lkg.firstChild) {
      this.doc.appendChild(lkg.firstChild);
    }
    var sel = currentSelection(document);
    sel.removeAllRanges();
    sel.addRange(this.lkgRange.thaw(this.doc));
  }
}

export = TransactionManager;

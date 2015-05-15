/// <reference path="../../types.d.ts" />

import events = require('events');
import OverlayManager = require('../editor-overlay/index');
import TransactionManager = require('../transaction-manager/index');
import Tokenizer = require('../tokenizer/index');
import AutoScroll = require('../auto-scroll/index');
import Block = require('../block/index');

declare class Editor extends events.EventEmitter {
  public overlay: OverlayManager;
  public transactions: TransactionManager;
  public el: HTMLElement;
  public wrapper: HTMLElement;
  public drag: any;
  public site: any;
  public wpcom: any;
  public media: any;
  public mousetrap: any;
  public autoscroll: AutoScroll;
  public tokens: Tokenizer;
  public selection: Range;
  public backward: boolean;
  public focus(): void;
  public addStyles(styles: string): void;
  public edit(post: string): void;
  public edit(post: Object): void;
  public isEmpty(): boolean;
  public mousetrapStopCallback(e: Event, element: Node): boolean;
  public publish();
  public publish(callback: (err: Error) => void);
  public publish(opts: any, callback: (err: Error) => void);
  public execute(name: string);
  public execute(name: string, val: any);
  public use(plugin: (editor: Editor) => void);
  public reset(): void;
  public on(event: 'contentchange', fn: () => void): Editor;
  public on(event: 'selectionchange', fn: () => void): Editor;
  public on(event: 'paste', fn: (content: DocumentFragment) => void): Editor;
  public on(event: string, fn: (...args: any[]) => any): Editor;
  public serialize(): string;
  public block(block: Block);
}

export = Editor;

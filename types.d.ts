/// <reference path="./node.d.ts" />

declare module "webmodules-command" {
  interface Command {
    // executes against the current document selection
    execute(value?: any): void;
    queryState(): boolean;
    queryEnabled(): boolean;

    // executes against the given `range` object
    execute(range: Range, value?: any): void;
    queryState(range: Range): boolean;
    queryEnabled(range: Range): boolean;
  }
  export = Command;
}

declare module "per-frame" {
  function throttle<T extends Function>(fn: T) : T;
  export = throttle;
}

declare module "component-classes" {
  function classes(el: HTMLElement): classes.ClassSet;
  module classes {
    export interface ClassSet {
      add(className: string): ClassSet;
      remove(className: string): ClassSet;
      toggle(className: string): ClassSet;
      has(className: string): ClassSet;
      array(): string[];
    }
  }
  export = classes;
}

declare module "mutation-observer" {
  export = MutationObserver;
}

declare module "component-query" {
  function query(selector: string, context: HTMLElement): HTMLElement;
  module query {
    export function all(selector: string, context: HTMLElement): HTMLElement[];
  }
  export = query;
}

declare module "domify" {
  function domify(html: string): HTMLElement;
  export = domify;
}

declare module "debug" {
  function debug(namespace: string): (format: string, ...args: any[]) => void;
  export = debug;
}

declare module "current-range" {
  function currentRange(doc: Document | Selection): Range;
  export = currentRange;
}

declare module "current-selection" {
  function currentSelection(doc: any): Selection;
  export = currentSelection;
}

declare module "matches-selector" {
  function matches(el: HTMLElement, selector: string): boolean;
  export = matches;
}

declare module "computed-style" {
  function computedStyle(el: HTMLElement, property: string): string;
  export = computedStyle;
}

declare module "raf" {
  function raf(fn: Function): number;
  module raf {
    export function cancel(id: number): void;
  }
  export = raf;
}

declare module "component-uid" {
  function uid(length: number): string;
  export = uid;
}

declare module "jed" {
  export function sprintf(format: string, ...args: any[]): string;
  // TODO: add other jed declarations as needed
}

declare module "split-at-range" {
  function split(n: Node, r: Range): DocumentFragment[];
  export = split;
}

declare module "range-normalize" {
  function normalize(r: Range): Range;
  export = normalize;
}

declare module "iframify" {
  function iframify(html: string): HTMLIFrameElement;
  export = iframify;
}

declare module "pcre-to-regexp" {
  function pcreToRegexp(pattern: string, keys?: string[]): RegExp;
  export = pcreToRegexp;
}

declare module "replace-text" {
  var replace: {
    // simple replacements
    (el: HTMLElement, match: string, replacement: string);
    (el: HTMLElement, match: RegExp, replacement: string);
    (el: HTMLElement, match: string, replacement: DocumentFragment);
    (el: HTMLElement, match: RegExp, replacement: DocumentFragment);
    (el: HTMLElement, match: string, replacement: HTMLElement);
    (el: HTMLElement, match: RegExp, replacement: HTMLElement);
    // sync function replacements
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range) => HTMLElement);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range) => HTMLElement);
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range) => DocumentFragment);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range) => DocumentFragment);
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range) => string);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range) => string);
    // async function replacements
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range, fn: (result: HTMLElement) => void) => void);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range, fn: (result: HTMLElement) => void) => void);
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range, fn: (result: DocumentFragment) => void) => void);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range, fn: (result: DocumentFragment) => void) => void);
    (el: HTMLElement, match: string, replacement: (match: string[], range: Range, fn: (result: string) => void) => void);
    (el: HTMLElement, match: RegExp, replacement: (match: string[], range: Range, fn: (result: string) => void) => void);
  };
  export = replace;
}

declare module "dom-path" {
  export function resolve(from: Node, to: number[]): Node;
  export function relative(from: Node, to: Node): number[];
}

declare module "frozen-range" {
  class FrozenRange {
    private startPath;
    private startOffset;
    private endPath;
    private endOffset;
    constructor(range: Range, reference: Node);
    public thaw(reference: Node, range?: Range): Range;
  }
  export = FrozenRange;
}

declare module "wrap-range" {
  function wrap(range: Range, element: string): HTMLElement;
  export = wrap;
}

declare module "get-document" {
  function getDocument(node: any): Document;
  export = getDocument;
}

declare module "selection-is-backward" {
  function isBackward(selection: Selection): boolean;
  export = isBackward;
}

declare module "selection-set-range" {
  function selectionSetRange(selection: Selection, range: Range, backwards?: boolean): boolean;
  export = selectionSetRange;
}

declare module "selectionchange-polyfill" {
  export function start(doc: Document): void;
  export function stop(doc: Document): void;
}

declare module "bowser" {
  export var browser: {
    msie: boolean;
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    opera: boolean;
    version: number;
  };
}

declare module "dataset" {
  function dataset(node: HTMLElement, attr?: string, value?: string): any;
  export = dataset;
}

declare module "block-elements" {
  var blockElements: string[];
  export = blockElements;
}

declare module "inline-elements" {
  var inlineElements: string[];
  export = inlineElements;
}

declare module "void-elements" {
  var voidElements: string[];
  export = voidElements;
}

declare module "collapse" {
  var collapse: {
    (s: Selection): void;
    (r: Range): void;
    toStart(s: Selection): void;
    toStart(r: Range): void;
    toEnd(s: Selection): void;
    toEnd(r: Range): void;
  }
  export = collapse;
}

declare module "dom-move" {
  var move: {
    (source: HTMLElement, destination: HTMLElement): HTMLElement;
    (source: HTMLElement): DocumentFragment;
  };
  export = move;
}

declare module "range-insert-node" {
  function insertNode(range: Range, node: Node): void;
  export = insertNode;
}

declare module "node-contains" {
  function contains(node: Node, other: Node): boolean;
  export = contains;
}

declare module "element-scroll-to" {
  function scrollTo(element: HTMLElement): void;
  export = scrollTo;
}

declare module "range-equals" {
  function rangeEquals(r1: Range, r2: Range): boolean;
  export = rangeEquals;
}

declare module "dom-serialize/interfaces" {
  export interface SerializeEvent extends CustomEvent {
    serializeTarget: Node;
  }

  export interface SerializeEventCallback {
    (e: SerializeEvent): void;
  }
}

declare module "dom-serialize" {
  import interfaces = require("dom-serialize/interfaces");
  var serialize: {
    (node: Node|NodeList|Array<Node>, context?: string, callback?: interfaces.SerializeEventCallback): string;
    (node: Node|NodeList|Array<Node>, callback?: interfaces.SerializeEventCallback): string;

    serializeText: (node: Text, opts?: any) => string;
  };

  export = serialize;
}

declare module "babel-runtime/core-js" {
  var def: any;
  export = def;
}

// TODO: Remove this once it lands on TypeScript
declare class WeakSet<T> {
  constructor();
  add(key: T): WeakSet<T>;
  delete(key: T): boolean;
  has(key: T): boolean;
}

interface ClipboardEvent extends Event {
  clipboardData: DataTransfer;
}

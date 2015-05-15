/// <reference path='../../types.d.ts' />

import scrollTo = require('element-scroll-to');

import Editor = require('../editor/index');

var SCROLL_TARGET_SIZE = 100;

class AutoScroll {

  private editor: Editor;
  private el: HTMLElement;
  private interval: any;
  private targetX: number;
  private targetY: number;
  private currentX: number;
  private currentY: number;
  private count: number = 0;

  constructor(editor: Editor) {
    this.editor = editor;
    this.el = document.createElement('div');
    this.el.className = 'scroll-target';
    this.el.style.zIndex = '-1';
    this.el.style.position = 'absolute';
    this.el.style.height = SCROLL_TARGET_SIZE + 'px';
    this.el.style.width = SCROLL_TARGET_SIZE + 'px';
  }

  public target(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    if (typeof this.currentX === 'undefined') this.currentX = x;
    if (typeof this.currentY === 'undefined') this.currentY = y;
  }

  private update() {
    if (typeof this.targetX === 'undefined' || typeof this.targetY === 'undefined') return;
    this.currentX = this.currentX * 0.9 + this.targetX * 0.1;
    this.currentY = this.currentY * 0.9 + this.targetY * 0.1;
    var wrapperRect = this.editor.wrapper.getBoundingClientRect();
    if (this.currentX < wrapperRect.left + SCROLL_TARGET_SIZE / 2) {
      this.currentX = wrapperRect.left + SCROLL_TARGET_SIZE / 2;
    }
    if (this.currentY < wrapperRect.top + SCROLL_TARGET_SIZE / 2) {
      this.currentY = SCROLL_TARGET_SIZE / 2;
    }
    if (this.currentX > wrapperRect.right - SCROLL_TARGET_SIZE / 2) {
      this.currentX = wrapperRect.right - SCROLL_TARGET_SIZE / 2;
    }
    if (this.currentY > wrapperRect.bottom - SCROLL_TARGET_SIZE / 2) {
      this.currentY = wrapperRect.bottom - SCROLL_TARGET_SIZE / 2;
    }
    this.el.style.top = (this.currentY - SCROLL_TARGET_SIZE / 2 - wrapperRect.top) + 'px';
    this.el.style.left = (this.currentX - SCROLL_TARGET_SIZE / 2 - wrapperRect.left) + 'px';
    scrollTo(this.el);
  }

  public start(): void {
    this.count++;
    if (this.count > 0 && !this.interval) {
      this.interval = setInterval(() => this.update(), 20);
      if (this.el.parentNode != this.editor.wrapper) {
        this.editor.wrapper.appendChild(this.el);
      }
    }
  }

  public stop(): void {
    this.count--;
    if (this.count <= 0 && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.currentX = this.currentY = this.targetX = this.targetY = undefined;
      this.editor.wrapper.removeChild(this.el);
    }
  }
}

export = AutoScroll;
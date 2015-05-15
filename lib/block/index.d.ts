/// <reference path="../../types.d.ts" />
/**
 * TypeScript dependencies
 */
import Editor = require('../editor/index');
import events = require('events');
declare class Block extends events.EventEmitter {
    /**
     * Private Fields
     */
    private _editor;
    private _overlay;
    private _el;
    private _id;
    private _hold;
    private _holdX;
    private _holdY;
    constructor(overlay: HTMLElement, editor: Editor);
    /**
     * Returns the current overlay reference for the block, searching
     * through the DOM of the editor to do so.
     */
    el: HTMLElement;
    /**
     * Returns the current overlay for the block
     */
    overlay: HTMLElement;
    /**
     * Returns the bound editor for the block
     */
    editor: Editor;
    /**
     * Binds the block to the editor instance
     */
    bind(editor: Editor): void;
    /**
     * Fired when the mouse button is pressed on the block
     */
    private onmousedown(e);
    /**
     * Fired when the mouse moves
     */
    private onmousemove(e);
    /**
     * Fired when the mouse button is lifted
     */
    private onmouseup(e);
    /**
     * Delete block through of `delete` button
     */
    private onremove(e);
    /**
     * Destroy the block
     */
    destroy(): void;
    /**
     * Sets the float direction of the block
     * @param {String} dir
     * @api public
     */
    float(dir: string): void;
    /**
     * Serializes the block
     */
    serialize(): Node;
    protected onDragEnter(e: DragEvent): void;
    protected onDragOver(e: DragEvent): void;
    protected onDragLeave(e: DragEvent): void;
    protected onDrop(e: DragEvent): void;
}
export = Block;

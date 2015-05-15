/// <reference path="../../types.d.ts" />

import domify = require('domify');

import Block = require('../block/index');
import Editor = require('../editor/index');

import template = require('./vimeo');

class VimeoBlock extends Block {

  private _videoId: string;

  public constructor(id: string) {
    super(domify(template({ id: id })));
    this._videoId = id;
  }

  /**
   * Serializes the video as a URL
   */

  public serialize(): Node {
    var url = "https://vimeo.com/" + this._videoId;
    return document.createTextNode(url); 
  }
}

export = VimeoBlock;

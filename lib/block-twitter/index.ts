/// <reference path="../../types.d.ts" />

import query = require('component-query');
import domify = require('domify');

import Block = require('../block/index');
import Editor = require('../editor/index');
import sandbox = require('../sandbox/index');

import template = require('./twitter');

class TwitterBlock extends Block {

  private _tweetId: string;
  private _user: string;

  public constructor(user: string, id: string) {
    super(domify(template()));
    this._user = user;
    this._tweetId = id;
    var body = query('.tweet-wrap', this.overlay);
    var tweet = sandbox('<blockquote class="twitter-tweet"><a href="https://twitter.com/twitterapi/status/' + id + '"></a></blockquote><script src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>');
    body.appendChild(tweet);
  }

  /**
   * Serializes the tweet as a URL
   */

  public serialize(): Node {
    var url = 'https://twitter.com/' + this._user + '/status/' + this._tweetId;
    return document.createTextNode(url); 
  }
}

export = TwitterBlock;

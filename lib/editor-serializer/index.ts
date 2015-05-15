/// <reference path="../../types.d.ts" />

/**
 * Module dependencies
 */

import dataset = require('dataset');
import query = require('component-query');
import matches = require('matches-selector');
import domSerialize = require('dom-serialize');
import DEBUG = require('debug');

/**
 * Local imports
 */

import Editor = require('../editor/index')

var debug = DEBUG('editor:serializer');

class Serializer {

  private editor: Editor;

  // a selector to match temporary objects that should be
  // removed from the markup during serialization
  private temporary: string;

  public constructor(editor: Editor) {
    this.editor = editor;
    this.temporary = 'span.join-hint, span.gallery-tmp-placeholder';
  }

  private spaces(s: string, replaceFirst: boolean, replaceLast: boolean): string {
    if (replaceFirst) {
      s = s.replace(/^ /g, '&nbsp;');
    }
    if (replaceLast) {
      s = s.replace(/ $/g, '&nbsp;');
    }
    s = s.replace(/  /g, ' &nbsp;');
    return s;
  }

  /**
   * Serializes a DOM node. Emits a "node" event, and a node-specific event
   * (i.e. "text", "element") for plugins to hook in to.
   *
   * Plugins may specify a different node to apply the serialization rules to
   * by setting the `serialize` property on the `Event` object provided.
   *
   * Useful for plugins.
   *
   * @param {Node} node - DOM node (TextNode, HTMLElement, etc.)
   * @return {String} serialized string of `node`
   * @public
   */

  public serialize(node: Node|NodeList|Array<Node>, context: string = 'post'): string {
    return domSerialize(node, context, (e) => {
      var target: Node = <Node>e.serializeTarget;

      if (target.nodeType === 1 /* element */) {
        // `data-serialize` is a raw string to use as the serialized content
        var data;
        if (data = dataset(<HTMLElement>target, 'serialize')) {
          debug('using `data-serialize` attribute for %o: %o', target, data);
          e.detail.serialize = data;

        } else if (matches(<HTMLElement>target, this.temporary)) {
          // don't render anything for "temporary" nodes
          // TODO: move this logic to whoever is responsible for these "temporary
          // elements"
          e.preventDefault();
        }

      } else if (target.nodeType === 3 /* text node */) {
        // use our "text node" serializer logic
        e.detail.serialize = this.serializeTextNode(<Text>target);

      } else {
        debug('ignoring serialization of Node: %o', node);
        e.preventDefault();
      }

    });
  }

  public serializeTextNode(text: Text): string {
    var content: string = domSerialize.serializeText(text, { named: false });
    content = this.spaces(content, !text.previousSibling, !text.nextSibling);
    return content;
  }

  /**
   * Processes the root node of the Editor instance's children,
   * producing the final HTML string to be saved.
   *
   * @return {String} serialized editor contents
   * @public
   */

  public serializeRoot(): string {

    //
    // IMPORTANT: this function shouldn't modify the markup it's operating on
    // as it's going to potentially be called async via a timer for auto-save
    //

    var result = this.serialize(this.editor.el.childNodes);

    // remove BR nodes
    result = result.replace(/<\/?br\s?>/g, '');

    return result;
  }

}

export = Serializer;

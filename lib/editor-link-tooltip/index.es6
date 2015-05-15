
/**
 * Module dependencies.
 */

import url from 'url';
import event from 'component-event';
import query from 'component-query';
import classes from 'component-classes';
import closest from 'component-closest';
import getDocument from 'get-document';
import currentRange from 'current-range';
import currentSelection from 'current-selection';
import normalize from 'range-normalize';
import RangeIterator from 'range-iterator';
import matches from 'matches-selector';
import throttle from 'per-frame';
import contains from 'node-contains';
import unwrapNode from 'unwrap-node';
import debug from 'debug';
debug = debug('editor:editor-link-tooltip');

/**
 * Template.
 */

import template from './link-tooltip';


/**
 * This plugin adds an inline view/edit prompt whenever the selection is
 * within a `<a>` link element.
 *
 * @return {Function} the editor plugin function
 * @public
 */

export default function setup () {
  return function (editor) {

    // get reference to `document` instance
    let doc = getDocument(editor.el);

    // initialize the `tip`
    let tip = editor.tip(template());
    tip.position('right');

    let form = query('form', tip.inner);
    let link = query('.link', form);
    let input = query('input', form);
    let done = query('.done', form);
    let change = query('.change', form);

    let formClasses = classes(form);

    // Set of A elements that are currently being edited
    let anchors;

    /**
     * Invoked when the <form> is submitted.
     * Executes the `linkPrompt` command logic, and
     * then returns the <form> to "view mode".
     *
     * @param {Event} e - event object for the "submit" event
     * @private
     */

    function onsubmit (e) {
      debug('onsubmit(%o)', e);
      e.preventDefault();

      let range = createRange(anchors);

      // ensure that the Editor instance is focused
      let selection = currentSelection(doc);
      selection.removeAllRanges();
      selection.addRange(range);

      // call `.el.focus()` directly so that a "focus" event is *not* emitted
      editor.el.focus();

      // figure out the link HREF value to use
      let link = input.value;
      if (link) {
        let parsed = url.parse(link);
        if (!parsed.protocol) {
          link = 'http://' + link;
        } else if ('javascript:' === String(parsed.protocol).toLowerCase()) {
          debug('detected XSS attempt: %o!', link);
          link = null;
        }
      }

      // if a link was given, then invoke "createLink",
      // otherwise remove the link
      if (link) {
        // sanitize link (loosely simulating WP.org's `esc_attr()` fn), GH-334
        link = link.replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/'/g, '&#39;')
                   .replace(/"/g, '&#34;');

        debug('setting "link" value %o', link);
        editor.commands.link.createLink.execute(range, link);
      } else {
        debug('got empty <input>, unwrapping');
        range = doc.createRange();
        anchors.forEach((node, i) => {
          let r = unwrapNode(node);
          if (0 === i) {
            range.setStart(r.startContainer, r.startOffset);
          }
          range.setEnd(r.endContainer, r.endOffset);
        });
      }

      anchors = null;

      // we want to be sure that the cursor is collapsed,
      // and placed *after* the newly created/removed link
      range.collapse(false);

      selection.removeAllRanges();
      selection.addRange(range);
    }

    /**
     * Invoked when the "change" link is clicked.
     * Puts the <form> into "edit" mode.
     *
     * @param {Event} e - event object for the "click" event
     * @private
     */

    let forceEdit = false;
    function onchangeclick (e) {
      debug('onchangeclick(%o)', e);
      e.preventDefault();
      forceEdit = true;
      check();
    }

    /**
     * <input>'s "input" event.
     *
     * @private
     */

    function oninput (e) {
      debug('oninput(%o)', e);
      let value = input.value;
      if (value.length > 0) {
        classes(done).remove('disabled');
      } else {
        classes(done).add('disabled');
      }
    }

    function oninputkeydown (e) {
      if (e.keyCode === 27 /* esc */) {
        debug('ESC key pressed, hiding link-tooltip');
        tip.hide();
      }
    }

    /**
     * Makes the tooltip enter "view mode" (no "edit" class).
     *
     * @param {String} href - href of the A nodes
     * @param {Set<HTMLElement>} nodes - Set of A nodes that we're focusing on
     * @private
     */

    function viewMode (href, nodes) {
      debug('viewMode(%o, %o)', href, nodes);

      let parsed = url.parse(href);
      if ('javascript:' === String(parsed.protocol).toLowerCase()) {
        debug('detected XSS attempt: %o!', href);
        parsed.protocol = 'http:';
        href = url.format(parsed);
      }
      input.value = link.href = link.textContent = href;
      formClasses.remove('edit');
      nodes.forEach((node) => classes(node).remove('editing'));
    }

    /**
     * Makes the tooltip enter "edit" mode.
     *
     * @param {String} href - href of the A nodes
     * @param {Set<HTMLElement>} nodes - Set of A nodes that we're focusing on
     * @private
     */

    function editMode (href, nodes) {
      debug('editMode(%o, %o)', href, nodes);

      input.value = link.href = link.textContent = href;

      // update the `done` button state
      oninput();

      formClasses.add('edit');
      nodes.forEach((node) => classes(node).add('editing'));

      // a small delay is necessary for the focus to work properly
      setTimeout(() => {
        debug('focusing <input>');
        input.focus();

        // force the cursor to the end of the input
        let length = input.value.length;
        input.setSelectionRange(length, length);
      }, 0);
    }

    /**
     * Invoked when the selection changes in the editor.
     * We check if the cursor is now inside an <a> anchor element
     * and if so, then show the link tip, otherwise hide the tip.
     *
     * @private
     */

    function checkShowTip () {
      let range = currentRange(editor.el);
      if (!range) {
        debug('hiding tooltip, since no Range');
        return tip.hide();
      }

      normalize(range);

      let common = range.commonAncestorContainer;

      // don't do anything if selection is inside the tooltip
      if (contains(tip.inner, common)) {
        return debug('ignoring since focus is inside the tooltip');
      }

      // hide tooltip if the current "selection" is not within the Editor
      if (!contains(editor.el, common)) {
        debug('hiding tooltip since focus is not in the Editor');
        return tip.hide();
      }

      let iterator = RangeIterator(range, (node) => node.childNodes.length === 0);

      let next, href, nodes, last;
      for (next of iterator) {
        let anchorNode = closest(next, 'a', next.nodeType !== 3, editor.el);
        if (!anchorNode) {
          debug('no A node parent to %o, hiding tooltip', next);
          return tip.hide();
        }
        if (href && href !== anchorNode.href) {
          debug('found conflicting link href\'s %o vs. %o, hiding tooltip', href, anchorNode.href);
          return tip.hide();
        }
        if (!nodes) {
          nodes = new Set();
          href = nodes.href = anchorNode.href;
        }
        nodes.add(anchorNode);
        last = anchorNode;
      }
      if (!nodes) {
        debug('no A node within selection, hiding tooltip');
        return tip.hide();
      }
      if (rangeAtEnd(range, last)) {
        debug('selection is at end of last anchor node %o, hiding tooltip', last);
        return tip.hide();
      }

      debug('detected %o A nodes selected with href %o', nodes.size, href);

      //if (lastAnchor && anchorNode !== lastAnchor) {
      //  debug('removing "editing" class from lastAnchor');
      //  classes(lastAnchor).remove('editing');
      //}

      if (forceEdit) {
        debug('edit button clicked, so go directly to "edit mode"');
        forceEdit = false;
        editMode(href, nodes);
      } else if (matches(last, 'a[href="#"]')) {
        debug('new A, so go directly to "edit mode"');
        editMode('', nodes);
      } else {
        // if we're already inside an A then fill the input and link
        // with the current contents
        debug('view mode');
        viewMode(href, nodes);
      }

      // and then show the Tip against the all the A nodes
      //tip.show(anchorNode);
      tip.show(createRange(nodes));

      anchors = nodes;
    }

    function createRange (nodes) {
      let range = doc.createRange();
      let array = Array.from(nodes);
      let last = array[array.length - 1];
      range.setStart(array[0], 0);
      range.setEnd(last, last.childNodes.length);
      return range;
    }

    /**
     * Returns `true` if `range` is a collapsed cursor at the end of the `node`,
     * returns `false` otherwise.
     *
     * @private
     */

    function rangeAtEnd (range, node) {
      if (!range.collapsed) return false;
      let last = node;
      while (last.lastChild) last = last.lastChild;
      return range.endContainer === last && last.nodeValue.length === range.endOffset;
    }

    /**
     * Invoked when the link tooltip is hidden.
     *
     * Removes the `.editing` class from any A links in the editor.
     * Unwraps any "new" A links (with href="#") to remove the link.
     *
     * @private
     */

    function onhide () {
      debug('onhide()');
      let node;

      // remove "editing" class from any A links
      let editing = query.all('a.editing', editor.el);
      for (let i = 0; i < editing.length; i++) {
        node = editing[i];
        debug('removing `.editing` class from <a> link %o', node);
        classes(node).remove('editing');
      }
      editing = null;

      // unwrapping any `href="#"` links from the editor
      let newLinks = query.all('a[href="#"]', editor.el);
      for (let i = 0; i < newLinks.length; i++) {
        node = newLinks[i];
        debug('unwrapping "new" link %o', node);
        unwrapNode(node);
      }
      newLinks = null;

      anchors = null;
    }

    tip.on('hide', onhide);

    // bind tooltip event listeners
    event.bind(form, 'submit', onsubmit);
    event.bind(done, 'click', onsubmit);
    event.bind(change, 'click', onchangeclick);
    event.bind(input, 'input', oninput);
    event.bind(input, 'keydown', oninputkeydown);

    let check = throttle(checkShowTip);
    editor.on('contentchange', check);
    editor.on('selectionchange', check);
  };
}


/**
 * Module dependencies.
 */

var dataset = require('dataset');
var throttle = require('per-frame');
var event = require('component-event');
var query = require('component-query');
var classes = require('component-classes');
var delegate = require('component-delegate');
var debug = require('debug')('editor:editor-toolbar');

/**
 * Module exports.
 */

module.exports = EditorToolbar;

/**
 * An Editor plugin that executes a given "command" based on a given DIV
 * formatbar container.
 *
 * It relies on event delegation, so that it is possible to dynamically set
 * the `data-command-name` on a given button after the plugin has been
 * initialized.
 *
 * @param {HTMLElement} container - the DOM node to wait for "click" events
 * @return {Function} the editor plugin function
 * @public
 */

function EditorToolbar (container) {
  return function (editor) {

    function getCommand (name) {
      var command = editor.commands[name];
      if (!command) {
        throw new TypeError('command name "' + name + '" was not defined in `commands` Object');
      }
      return command;
    }

    function onclick (e) {
      debug('editor toolbar "click" event: %o', e);
      var el = e.delegateTarget;
      var commandName = el && dataset(el, 'commandName');
      if (!el || !commandName) {
        return debug('no "data-command-name" button clicked on!');
      }

      var command = getCommand(commandName);
      debug('executing command: %o', commandName);

      /**
       * Focus will have been taken away from the Editor instance when
       * clicking on a button (Chrome will return the focus automatically
       * but only if the selection is not collapsed. As per: http://jsbin.com/tupaj/1/edit?html,js,output).
       * It is important that we focus the instance again before executing
       * the command, because it might rely on selection data.
       */
      editor.focus();

      command.execute();
    }

    function updateStates () {
      debug('updating editor toolbar button states for %o', container);

      // XXX: if this query every time leads to poor performance,
      // then we'll need to figure out a caching technique for
      // determining the command buttons in the `container`.
      var buttons = query.all('button[data-command-name]', container);
      debug('updating %d <button> nodes', buttons.length);

      var withinEditor = !!editor.selection;
      for (var i = 0; i < buttons.length; i++) {
        try {
          updateButton(buttons[i], withinEditor);
        } catch (e) {
          debug('button update failed: %s', e.message);
        }
      }
    }

    function updateButton (button, withinEditor) {
      var cl = classes(button);
      var commandName = dataset(button, 'commandName');
      var disableTitle = dataset(button, 'disableTitle');

      if (disableTitle && !dataset(button, 'enableTitle')) {
        debug('defining "data-enable-title" on button %o', button);
        dataset(button, 'enableTitle', button.title);
      }

      var command = getCommand(commandName);

      if (withinEditor && command.queryEnabled()) {
        button.removeAttribute('disabled');

        var active = command.queryState();

        // normal button
        if (active) {
          cl.add('active');
        } else {
          cl.remove('active');
        }

        // a "toggle" button (i.e. the "link" button)
        if (disableTitle) {
          if (active) {
            if (cl.has('disable')) {
              // "enable command" is active, and "disable" button is showing. do nothing...
            } else {
              // "enable command" is active, and "disable" button is not showing. toggle to "disabled" state.
              cl.add('disable');
              button.setAttribute('title', disableTitle);
            }
          } else {
            if (cl.has('disable')) {
              // "enable command" is not active, and "disable" button is showing. toggle to "active" state.
              cl.remove('disable');
              button.setAttribute('title', dataset(button, 'enableTitle'));
            } else {
              // "enable command" is not active, and "disable" button is not showing. do nothing...
            }
          }
        }

      } else {
        button.setAttribute('disabled', 'disabled');
        cl.remove('active');
        if (cl.has('disable')) {
          // reset to "enable" state
          cl.remove('disable');
          button.setAttribute('title', dataset(button, 'enableTitle'));
        }
      }
    }

    var check = throttle(updateStates);
    editor.on('contentchange', check);
    editor.on('selectionchange', check);

    var fn = delegate.bind(container, 'button[data-command-name]', 'click', onclick);
  };
}

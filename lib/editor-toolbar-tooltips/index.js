
/**
 * Module dependencies.
 */

var dataset = require('dataset');
var event = require('component-event');
var query = require('component-query');
var classes = require('component-classes');
var throttle = require('per-frame');
var EditorToolbar = require('../editor-toolbar');
var debug = require('debug')('editor:editor-toolbar-tooltips');

/**
 * Module exports.
 */

module.exports = setup;

/**
 * This is a Editor plugin that sets up an `EditorTip` instance
 * for the given `button` DOM element, which is assumed to be a
 * <button> element within the Editor's "toolbar".
 *
 * @param {String} content - the toolbar HTML to render inside the tooltip
 * @param {DOMElement} button - the DOM node to bind the tooltip to
 * @return {Function} the editor plugin function
 * @public
 */

function setup (content, button) {
  return function (editor) {

    var currentCommand;
    var justChanged = false;
    var activeMode = dataset(button, 'active');
    var inactiveButton = button.innerHTML;
    var buttonClasses = classes(button);

    // initialize the `tip`
    var tip = editor.tip(content);
    tip.position('bottom');

    function onshow (target) {
      debug('onshow(%o)', target);
      setTimeout(function () {
        tip.addClickOutside();
      }, 50);
    }

    function onclick (e) {
      debug('onclick(%o)', e);
      if (activeMode && currentCommand) {
        debug('executing %o command', currentCommand);
        editor.execute(currentCommand);
      } else {
        tip.toggle(button);
      }
    }

    function checkState () {
      // check the inside of the Tip for any "active" button
      var active = query('.active', tip.inner);
      if (active) {
        var command = dataset(active, 'commandName');;
        if (currentCommand !== command) {
          debug('setting button state to %o', command);
          button.innerHTML = active.innerHTML;
          if (activeMode) {
            debug('adding "active"');
            buttonClasses.add('active');
          }
          if (!justChanged) {
            tip.hide();
          }
          currentCommand = command;
        }
      } else if (currentCommand) {
        debug('setting button to "inactive" state');
        button.innerHTML = inactiveButton;
        if (activeMode) {
          debug('removing "active"');
          buttonClasses.remove('active');
        }
        currentCommand = null;
        tip.hide();
      }

      justChanged = false;
    }

    function oninnerclick (e) {
      debug('oninnerclick');
      justChanged = true;
    }

    tip.on('show', onshow);

    // show the Tip upon a "click" event on the `button`
    event.bind(button, 'click', onclick);

    event.bind(tip.inner, 'click', oninnerclick);

    // set up the Tip's `.inner` div to be the editor plugin toolbar
    editor.use(EditorToolbar(tip.inner));

    var check = throttle(checkState);
    editor.on('contentchange', check);
    editor.on('selectionchange', check);
  };
}

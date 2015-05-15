/// <reference path="../../types.d.ts" />

/**
 * Module dependencies.
 */

import Command = require('webmodules-command');
import DEBUG = require('debug');

var debug = DEBUG('editor:editor-keyboard-shortcuts');

/**
 * `Editor` plugin that maps keyboard shortcuts to Command invokations.
 * i.e. "super + b" would map to the "bold" command (`editor.commands.bold`).
 *
 * @param {Object} map - map of shortcut keys to command names
 * @return {Function} the editor plugin function
 * @public
 */

function setup (map): (editor)=>void {

  return function (editor) {
    var command: Command;
    var name: string;

    for (var key in map) {
      name = map[key];
      if (!name) {
        debug('skipping %o since no command name given', key);
        continue;
      }

      command = editor.commands[name];
      if (!command) {
        debug('skipping %o since it is %o', key, command);
        continue;
      }

      // bind key combo listener
      editor.mousetrap.bind(key, listener(key, command));
    }
  };

}

function listener (key: string, command: Command): (e: Event)=>void {
  return function (e) {
    e.preventDefault();

    if (command.queryEnabled()) {
      debug('executing %o %o command', key, command);
      // `editor.focus()` isn't actually necessary here, since the keypress
      // listener wouldn't have been invoked in the first place if the
      // editor wasn't focused when the shortcut keys were pressed in.
      command.execute();
    }
  };
}

export = setup;

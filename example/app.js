/**
 * Module dependencies
 */

var Zeditor = require('zeditor');
var ZeditorPaste = require('zeditor-paste');

/**
 * Get DOM nodes
 */

var editorNode = document.getElementById('editor');

/**
 * Instantiate editor
 */

Zeditor(editorNode);
ZeditorPaste(editorNode);

/**
 * Other functionality
 */

Zeditor(editorNode).on('error', function (err) {
  // for now, any "error" event log to the console
  console.error('editor "error" event: %o', err);
});

var outputNode = document.getElementById('output');
var showEditorButtonNode = document.getElementById('showEditor');
var showOutputButtonNode = document.getElementById('showOutput');

showEditorButtonNode.addEventListener('click', function (e) {
  e.preventDefault();

  showEditorButtonNode.style.display = 'none';
  editorNode.style.display = 'block';

  showOutputButtonNode.style.display = 'inline';
  outputNode.style.display = 'none';
}, false);

showOutputButtonNode.addEventListener('click', function (e) {
  e.preventDefault();

  showEditorButtonNode.style.display = 'inline';
  editorNode.style.display = 'none';

  showOutputButtonNode.style.display = 'none';
  outputNode.style.display = 'block';

  outputNode.textContent = editor.serializer.serializeRoot();
}, false);
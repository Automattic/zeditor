
/**
 * Module dependencies.
 */

var url = require('url');
var Editor = require('../');
var debug = require('debug')('editor-app');

var parsed = url.parse(location.href, true);

var editorNode = document.getElementById('editor');
var outputNode = document.getElementById('output');
var showEditorButtonNode = document.getElementById('showEditor');
var showOutputButtonNode = document.getElementById('showOutput');

window.editor = new Editor(editorNode);
editor.placeholder('Tell me your story...');

// Plugins
editor.use(require('editor-paste')());

// editor.use(require('../../editor-emoji')());
// editor.use(require('../../editor-twemoji')());
// editor.use(require('../../editor-smileys')());
// editor.use(require('../../editor-markdown')());
// editor.use(require('../../editor-save-state')('new'));
// editor.use(require('../../editor-detect-title')({ words: 5 }));
// editor.use(require('../../editor-paste-link')());
// editor.use(require('../../editor-checkbox-list')());
// editor.use(require('../../editor-inline-terms/mentions')());
// editor.use(require('../../editor-inline-terms/tags')());
// editor.use(require('../../editor-inline-terms/xposts')());

editor.on('error', function (err) {
  // for now, any "error" event log to the console
  console.error('editor "error" event: %o', err);
});

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

editor.focus();
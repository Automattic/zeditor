/// <reference path="../../types.d.ts" />

import iframify = require('iframify');

var FONTS = '<link rel="stylesheet" id="h5-font-css" href="https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,400,300,600|Merriweather:400,300">';

var BASE_STYLE = 
"<style>\n" +
"  body {\n" +
"    font-family: 'Open Sans', 'Helvetica Neue', sans-serif;\n" +
"    font-size: 11pt;\n" +
"    text-align: center;\n" +
"  }\n" +
"  a {\n" +
"    color: #1b8be0;\n" +
"  }\n" +
"</style>\n";

// TODO: link to a wp.com hosted version of this
var JQUERY = '<script src="https://code.jquery.com/jquery-2.1.1.js"></script>';

// Needed because jQuery mistakenly uses location.href instead of document.baseURI
// when converting relative URLs into absolute URLs on its XHR calls.
var JQUERY_PATCH = '<script>' +
'(function(){\n' +
'  var ajax = $.ajax;\n' +
'  $.ajax = function() {\n' +
'    if (typeof arguments[0].url) {\n' +
'      arguments[0].url = arguments[0].url.replace(/^\\/\\//, \'https://\');\n' +
'    }\n' +
'    return ajax.apply(this, arguments);\n' +
'  };\n' +
'})();\n' +
'</script>\n';

function sandbox(body: string): HTMLIFrameElement {
  return iframify(FONTS + BASE_STYLE + JQUERY + JQUERY_PATCH + body);
}

export = sandbox;

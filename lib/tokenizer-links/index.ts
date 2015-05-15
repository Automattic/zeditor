import Editor = require('../editor/index');
import DEBUG = require('debug');
import Token = require('../tokenizer/token');
import query = require('component-query');

var debug = DEBUG('editor:tokenizer:shortcodes');
var regExp = require('urlregexp');

function tokenizerEmbeds() {
  return function (e: Editor) {

    e.tokens.on('update', function(el: HTMLElement, content: string) {
      var m: RegExpExecArray;
      while (m = regExp.exec(content)) {
        if (content[m.index - 1] == '@') {
          // ignore email addresses, this is needed because JS
          // doesn't offer us RegExp lookbehinds
          continue;
        }
        handleMatch(el, m);
      }
    });

    function checkForExistingLinks(el: HTMLElement, m: RegExpExecArray): boolean {
      var t = e.tokens.createToken(el, m[0], m.index);
      var existingLinks = query.all('a', el);
      for (var i = 0; i < existingLinks.length; i++) {
        var existingLink = existingLinks[i];
        if ((existingLink.getAttribute('href') == includeProtocol(m[0])) &&
            (existingLink.textContent == m[0]) &&
            t.intersectsNode(existingLink)) {
          return true;
        }
      }
      return false;
    }

    function includeProtocol(input: string): string {
      if (!input.match(/^https?\:\/\//)) {
        if (input.match(/^\/\//)) {
          input = location.protocol + input;
        } else {
          input = 'http://' + input;
        }
      }
      return input;
    }

    function replaceTokenWithLink(token: Token): Node {
      var a = document.createElement('a');
      a.appendChild(token.range.extractContents());
      a.href = includeProtocol(token.text);
      return a;
    };

    function handleMatch(el: HTMLElement, m: RegExpExecArray) {
      var hasExistingLink = checkForExistingLinks(el, m);
      if (hasExistingLink) {
        return;
      }
      var t = e.tokens.createToken(el, m[0], m.index);
      t.type = 'link';
      t.replacement = replaceTokenWithLink;
      t.replaceOnEnter = true;
      e.tokens.add(t);
    }
  }
}

export = tokenizerEmbeds;
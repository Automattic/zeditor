import Tokenizer = require('./index');
import query = require('component-query');

class TokenizerRenderer {
  public el: HTMLElement;
  private tokenizer: Tokenizer;

  public constructor(tokenizer: Tokenizer) {
    this.el = document.createElement('div');
    this.el.className = 'token-container';
    this.tokenizer = tokenizer;
  }

  public render(): void {
    for (var i = 0; i < this.el.childNodes.length; i++) {
      if ((<HTMLElement>this.el.childNodes[i]).className == 'token-accessory') {
        this.el.childNodes[i]['used'] = false;
      } else {
        this.el.removeChild(this.el.childNodes[i--]);
      }
    }
    var baseRect = this.el.getBoundingClientRect();
    var allotted = this.tokenizer.allotted;
    var length = allotted.length;
    for (var i = 0; i < length; i++) {
      var token = allotted[i];
      if (token.invisible) {
        continue;
      }
      var range = token.range;
      var rects = range.getClientRects();
      var rectsLength = rects.length;
      var first = true;
      for (var j = 0; j < rectsLength; j++) {
        var rect = rects[j];
        // skip bogus rects (sometimes Chrome hands us over
        // some rects which are 0, 1 or 2px and make no sense)
        if (rect.width <= 2) {
          continue;
        }
        var div = document.createElement('div');
        div.className = 'token';
        if (first) {
          div.className += ' first';
          first = false;
        }
        if (token.pending) {
          div.className += ' pending';
        } else {
          div.className += ' ready';
        }
        if (token.focused()) {
          div.className += ' focused';
        }
        div.style.top = (rect.top - baseRect.top) + 'px';
        div.style.left = (rect.left - baseRect.left) + 'px';
        div.style.width = rect.width + 'px';
        div.style.height = rect.height + 'px';
        this.el.appendChild(div);
      }
      if (div) {
        div.className += ' last';
      }
      if (token.focused() && token.accessory) {
        var boundingRect = range.getBoundingClientRect();
        token.accessory.style.position = 'absolute';
        token.accessory.style.top = (boundingRect.bottom - baseRect.top) + 'px';
        token.accessory.style.left = (boundingRect.left - baseRect.left) + 'px';
        token.accessory.style.width = boundingRect.width + 'px';
        if (token.accessory.parentNode != this.el) {
          this.el.appendChild(token.accessory);
        }
        token.accessory['used'] = true;
      }
    }

    var accessories = query.all('.token-accessory', this.el);
    for (var i = 0; i < accessories.length; i++) {
      if (!accessories[i]['used']) {
        this.el.removeChild(accessories[i]);
      }
    }
  }
}

export = TokenizerRenderer;
import CodeMirror from 'codemirror';
import Block from '../block';
import template from './code-block';
import domify from 'domify';
import inserted from 'inserted';
import classes from 'component-classes';
import {} from 'codemirror/mode/javascript/javascript';
import {} from 'codemirror/mode/css/css';
import {} from 'codemirror/mode/htmlmixed/htmlmixed';
import {} from 'codemirror/mode/clike/clike';
import {} from 'codemirror/mode/php/php';
import {} from 'codemirror/mode/markdown/markdown';
import {} from 'codemirror/mode/diff/diff';
import Controls from '../block-controls';
import dataset from 'dataset';

var el = domify(template());

class CodeBlock extends Block {
  constructor() {
    super(el.cloneNode(true));
    inserted(this.overlay, this.oninserted.bind(this));
    this.controls = new Controls();
  }

  oninserted() {
    // We need to wait here until the overlay is actually visible on the page.
    // coremirror will fail to produce a proper layout for the editor if it's
    // nested inside an element with `display: none`.
    var interval = setInterval(() => {
      if (this.overlay.style.display != 'block') {
        return;
      }
      clearInterval(interval);
      this.cm = new CodeMirror(this.overlay.querySelector('.code-wrapper'), {
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        mode: ''
      });
      this.cm.on('focus', () => classes(this.overlay).add('inner-focused'));
      this.cm.on('blur', () => classes(this.overlay).remove('inner-focused'));
      this.cm.focus();
      this.body = this.overlay.querySelector('.body');
      this.body.appendChild(this.controls.el);
      this.language = this.overlay.querySelector('select.language');
      this.language.value = localStorage.automatticEditorCodeBlockLastUsedLanguage || '';
      this.language.addEventListener('change', (e) => {
        localStorage.automatticEditorCodeBlockLastUsedLanguage = this.language.value;
        this.languageChanged()
      });
      this.languageChanged();
      this.controls.add(this.overlay.querySelector('.options'), false, false);
    }, 0);
  }

  serialize(context) {
    if (context == 'post') {
      var result;
      if (this.language.value) {
        result = `[code language="${this.language.value}"]\n`;  
      } else {
        result = `[code]\n`;
      }
      result += this.cm.getValue();
      result += `\n[/code]`;
      
      return result;
    }

    var pre = document.createElement('pre');
    pre.appendChild(document.createTextNode(this.cm.getValue()));
    return pre;
  }

  languageChanged() {
    var selected = this.language.querySelector(`option[value=${this.language.value || '""'}]`);
    var mode = dataset(selected, 'mode') || this.language.value;
    this.cm.setOption('mode', mode);
  }
}

export default CodeBlock;
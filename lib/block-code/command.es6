import CodeBlock from '.';
import AbstractCommand from 'abstract-command';
import WrapCommand from 'wrap-command';

class CodeCommand extends AbstractCommand {

  constructor (editor) {
    super(document);
    this.editor = editor;
    this.wrapCommand = new WrapCommand('code');
  }

  _execute(range, value) {
    // TODO: add full line/multi line selection check
    // to allow converting existing multi-line blocks
    if (range.collapsed) {
      this.editor.block(new CodeBlock());
    } else {
      this.wrapCommand.execute(range, value);
    }
  }

  _queryState(range) {
    return this.wrapCommand.queryState(range);
  }

  _queryEnabled(range) {
    return this.wrapCommand.queryEnabled(range);
  }
}

export default CodeCommand;

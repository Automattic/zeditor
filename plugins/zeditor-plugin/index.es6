let plugins = Symbol('plugins');

export default function(Ctor, name) {
  if (typeof name == 'undefined') {
    name = Ctor.name;
  }
  return function(editor, ...args) {
    if (!editor[plugins]) {
      editor[plugins] = new Map();
    }
    if (editor[plugins][name]) {
      return editor[plugins][name];
    }
    return editor[plugins][name] = new Ctor(editor, ...args);
  }
}
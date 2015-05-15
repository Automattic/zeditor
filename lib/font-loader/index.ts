class FontLoader {

  public el: HTMLElement;

  constructor() {
    if (!(this instanceof FontLoader)) return new FontLoader();
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.width = '0px';
    this.el.style.height = '0px';
    this.el.style.overflow = 'hidden';
  }

  /**
   * Requests loading of the specified font
   */

  public load(family: string, weight: number = 400, style: string = 'normal'): void {
    var p = document.createElement('p');
    p.innerHTML = family + ' ' + weight + ' ' + style;
    p.style.fontFamily = family;
    p.style.fontWeight = weight.toString();
    p.style.fontStyle = style;
    this.el.appendChild(p);
  }
}

export = FontLoader;

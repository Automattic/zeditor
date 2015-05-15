import leafRange = require('./leaf-range');

function rangePosition(r: Range, n: Node): rangePosition.Position {

  if (!r.collapsed) {
    throw new Error('Range is not collapsed.');
  }

  var r1 = leafRange(r);
  var r2 = document.createRange();
  r2.selectNodeContents(n);
  r2 = leafRange(r2);

  var comparison1 = r1.compareBoundaryPoints(Range.START_TO_START, r2);
  if (comparison1 < 0) {
    return rangePosition.Position.BEFORE;
  } else if (comparison1 == 0) {
    return rangePosition.Position.START;
  } else {
    var comparison2 = r1.compareBoundaryPoints(Range.END_TO_END, r2);
    if (comparison2 < 0) {
      return rangePosition.Position.MIDDLE;
    } else if (comparison2 == 0) {
      return rangePosition.Position.END;
    } else {
      return rangePosition.Position.AFTER;
    }
  }
}

module rangePosition {
  export enum Position {
    BEFORE,
    START,
    MIDDLE,
    END,
    AFTER
  }
  export var BEFORE = Position.BEFORE;
  export var START = Position.START;
  export var MIDDLE = Position.MIDDLE;
  export var END = Position.END;
  export var AFTER = Position.AFTER;
}

export = rangePosition;

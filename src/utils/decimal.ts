import D from "decimal.js";

export class Decimal extends D {
  constructor(num: D.Value) {
    let validNumber: D.Value;

    if (num instanceof D) {
      validNumber = num;
    } else {
      try {
        const tempDecimal = new D(num);
        if (!tempDecimal.isNaN()) {
          validNumber = tempDecimal;
        } else {
          validNumber = new D(0);
        }
      } catch {
        validNumber = new D(0);
      }
    }
    super(validNumber.toString());
  }
}

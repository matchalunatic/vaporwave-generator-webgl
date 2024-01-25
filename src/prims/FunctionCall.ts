export interface FunctionCall {
  f_id: number;
  flags: number;
  arg1: Array<number>;
  arg2: Array<number>;
  arg3: Array<number>;
}

export interface FunctionCallFields {
  f_id: number,
  flags: number,
  arg1: Array<number>;
  arg2: Array<number>;
  arg3: Array<number>;
}

export class FunctionCallsArray extends Array<FunctionCall> {
  toBasic() {
    let out: Array<Object> = [];
    for (let v of this) {
      out.push(v.toBasic());
    }
    while (out.length < 8) {
      out.push({
        f_id: 0,
        flags: 0,
        arg1: [0, 0, 0, 0],
        arg2: [0, 0, 0, 0],
        arg3: [0, 0, 0, 0],
      });
    }
    // console.log(out);
    return out;
  }
}

export type FunctionCallType = FunctionCall;
export class FunctionCall {
  constructor(p: FunctionCallFields) {
    this.f_id = p.f_id;
    this.flags = p.flags;
    this.arg1 = Array<number>(4).fill(0);
    this.arg2 = Array<number>(4).fill(0);
    this.arg3 = Array<number>(4).fill(0);
    for (let i = 0; i < 4; i++) {
      if (p.arg1.length > i) {
        this.arg1[i] = p.arg1[i];
      }
      if (p.arg2.length > i) {
        this.arg2[i] = p.arg2[i];
      }
      if (p.arg3.length > i) {
        this.arg3[i] = p.arg3[i];
      }
    }
  }
  toBasic = () => {
    this.arg1.length = 4;
    this.arg2.length = 4;
    this.arg3.length = 4;
    return {
      f_id: this.f_id,
      flags: this.flags,
      arg1: this.arg1,
      arg2: this.arg2,
      arg3: this.arg3,
    };
  }
}

export type MAX_CALLS_PER_PIPELINE = 16;
export const MAX_CALLS_PER_PIPELINE = 16;

import { BufferGeometry, Vector2, Vector3 } from "three";

const foo = new Vector3(0, 0, 0);

type VectorProgramOpcode = {
  opcode: number;
};

type VectorProgramArg0 = {};
type VectorProgramArg1<T> = VectorProgramArg0 & {
  op1: T;
};

type VectorProgramArg2<T> = VectorProgramArg1<T> & {
  op2: T;
};

type VectorProgramArg3<T> = VectorProgramArg2<T> & {
  op3: T;
};

type VectorProgramArg4<T> = VectorProgramArg3<T> & {
  op4: T;
};

type VectorProgramArgAny<T> =
  | VectorProgramArg0
  | VectorProgramArg1<T>
  | VectorProgramArg2<T>
  | VectorProgramArg3<T>
  | VectorProgramArg4<T>;


type VectorProgramInstruction<T> = VectorProgramOpcode & VectorProgramArgAny<T>;

interface VPIInstructionEmitter {
  opcode: number;
}

abstract class VPIInstructionEmitter1<T> implements VPIInstructionEmitter {
    opcode = 0
    emit(op1: T): VectorProgramOpcode & VectorProgramArg1<T> {
        return {
            opcode: this.opcode,
            op1: op1,
        }
    }
}

abstract class VPIInstructionEmitter2<T> implements VPIInstructionEmitter {
    opcode = 0
    emit(op1: T, op2: T): VectorProgramOpcode & VectorProgramArg2<T> {
        return {
            opcode: this.opcode,
            op1: op1,
            op2: op2,
        }
    }
}

class VPISetIntensity extends VPIInstructionEmitter1<number> {
    opcode = 1;
}

class VPISetPhosphorDecay extends VPIInstructionEmitter1<number> {
    opcode = 2;
}

class VPIMoveBeamCartesian extends VPIInstructionEmitter1<Vector2> {
    opcode = 3;
}

class VPIMoveBeamPolar extends VPIInstructionEmitter2<number> {
    opcode = 4;
}

const iSetIntensity = new VPISetIntensity();
const iSetPhosphorDecay = new VPISetPhosphorDecay();
const iMoveBeamCartesian = new VPIMoveBeamCartesian()
const iMoveBeamPolar = new VPIMoveBeamPolar();
class VectorProgram {
  private program: VectorProgramInstruction<number|Vector2|Vector3>[];
  constructor() {
    this.program = [];
  }


  setIntensity = (intensity: number): VectorProgram => {
    this.program.push(iSetIntensity.emit(intensity));
    return this;
  };

  setPhosphorDecay = (decay: number): VectorProgram => {
    this.program.push(iSetPhosphorDecay.emit(decay))
    return this;
  }

  moveBeamCartesian = (to: Vector2): VectorProgram => {
    this.program.push(iMoveBeamCartesian.emit(to))
    return this;
  }

    moveBeamPolar = (angle: number, radius: number): VectorProgram => {
        this.program.push(iMoveBeamPolar.emit(angle, radius))
        return this;
    }
}

class VectorScreenGeometry extends BufferGeometry {
  constructor() {
    super();
    this.type = "VectorScreenGeometry";
  }
}

export { foo, VectorScreenGeometry, VectorProgram };

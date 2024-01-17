function pickRandomElement<T>(list: T[]): T  {
    if (list.length === 0) {
        throw new Error("cannot pick element from empty list");
    }
    return list[Math.floor(Math.random() * list.length)] as T;
}

function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
            Object.create(null)
        );
      });
    });
  }
  
const polarRandom = (amplitude?: number, internalOffset?: number, externalOffset?: number): number => {
  if (internalOffset === undefined) {
    internalOffset = 0.0;
  }
  if (externalOffset === undefined) {
    externalOffset = 0.0;
  }
  if (amplitude === undefined) {
    amplitude = 1.0;
  }
  return (Math.random() - 0.5 + internalOffset) * amplitude + externalOffset;
}

const arrayAbs = (ns: number[]): number[] => {
  return ns.map(Math.abs);
}
export { pickRandomElement, applyMixins, polarRandom, arrayAbs };


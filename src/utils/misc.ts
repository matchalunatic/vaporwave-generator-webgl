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
  
export { pickRandomElement, applyMixins };


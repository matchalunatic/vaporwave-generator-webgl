function pickRandomElement<T>(list: T[]): T  {
    if (list.length === 0) {
        throw new Error("cannot pick element from empty list");
    }
    return list[Math.floor(Math.random() * list.length)] as T;
}

export { pickRandomElement };


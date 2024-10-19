const firstLetterIs = (full: string, first: string) => {
    return full.at(0) === first;
}

const basicTypes = [
    'int',
    'long',
    'uint',
    'bool',
    'float',
    'ulong',
]

export const matchByType = (type1: string, type2: string) => {
    const isBasicType =  basicTypes.includes(type1) || basicTypes.includes(type2);
    if (type1 === type2) return [1, isBasicType ? .6 : 2];
    
    if (firstLetterIs(type1, '%') && !firstLetterIs(type2, '%')) {
        return [0, .5];
    } else if (!firstLetterIs(type1, '%') && firstLetterIs(type2, '%')) {
        return [0, .5];
    }

    return [0, 1];
}
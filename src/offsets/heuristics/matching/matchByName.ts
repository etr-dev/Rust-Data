import { Reliability, Score } from "../interfaces/scores.types";

const firstLetterIs = (full: string, first: string) => {
    return full.at(0) === first;
}

export const matchByName = (name1: string, name2: string): [Score, Reliability] => {
    // If they are non-encrypted and have then same name then it is a match
    if (!firstLetterIs(name1, '%') && !firstLetterIs(name2, '%') && name1 === name2) return [1,4];

    // If they are non-encrypted and don't have then same name then it is not a match
    if (!firstLetterIs(name1, '%') && !firstLetterIs(name2, '%') && name1 !== name2) return [0,4];
    

    // name1 is encrypted but name2 isn't encrypted
    if (firstLetterIs(name1, '%') && !firstLetterIs(name2, '%')) return [.5, .5];
    
    // name1 is not encrypted but name2 is encrypted
    if (!firstLetterIs(name1, '%') && firstLetterIs(name2, '%')) return [.5, .5];
    
    return [0, 1];
}
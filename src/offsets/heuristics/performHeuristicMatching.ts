import { IOffset } from "../interfaces/offset.interface";
import { RustOffsets } from "../interfaces/rust.interface";
import { matchByName } from "./matching/matchByName";
import { matchByOffsetProximity } from "./matching/matchByOffset";
import { extractSurroundingContext, matchByContext } from "./matching/matchBySurroundingVariables";
import { matchByType } from "./matching/matchByType";
import { OpenAI } from "openai";

interface Input {
    currentOffsets: RustOffsets;
    previousOffsets: RustOffsets;
}

const replaceOffset = (offsets: IOffset[], replaceMap: Record<string, IOutput>) => {
    const result = offsets.map(off => {
        const name = off.name;
        off.name = replaceMap[name]?.updated ?? name;
        off.score = replaceMap[name]?.score;

        return off;
    })

    return result;
}

export const performHeuristicMatching = ({ currentOffsets, previousOffsets }: Input): RustOffsets => {
    const classes = Object.keys(currentOffsets);
    const output: RustOffsets = currentOffsets;

    classes.forEach((cls) => {
        const offsets = currentOffsets[cls];
        const prevOffsets = previousOffsets[cls];
        if(Array.isArray(currentOffsets[cls])) {
            const matches = combineHeuristicMatchesWithProximity(prevOffsets as IOffset[], offsets as IOffset[])
            const newOffsets = replaceOffset(offsets as IOffset[], matches);
            output[cls] = newOffsets;
        }
    })

    return output;
}

interface BestMatch {
    name: string;
    score: number;
}

interface IOutput {
    original: string;
    updated: string;
    score: number;
}

export const combineHeuristicMatchesWithProximity = (
    nonEncrypted: IOffset[],
    encrypted: IOffset[]
  ): Record<string, IOutput> => {
    const finalMatches: Record<string, IOutput> = {};
    const windowSize = 6;

    nonEncrypted.forEach((nonEncEntry, idx) => {
      let bestMatch: BestMatch | null = null;
  
      const nonEncCtx = extractSurroundingContext(nonEncrypted, idx, windowSize);

      encrypted.forEach((encEntry, idx2) => {
        let score = 0;
  
        // const nameScale = .25;
        // const offsetScale = .2;
        // const typeScale = .25;
        const contextScale = 1;

        const encCtx = extractSurroundingContext(encrypted, idx2, windowSize);

        const [nameScore, nameReliability] = matchByName(nonEncEntry.name, encEntry.name);
        // const [offsetScore, offsetReliability] = matchByOffsetProximity(nonEncEntry.offset, encEntry.offset);
        // const [typeScore, typeReliability] = matchByType(nonEncEntry.type, encEntry.type);

        score += matchByContext(nonEncCtx, encCtx) * contextScale;

        if (nameScore === 1 && nameReliability === 1) {
            bestMatch = { name: encEntry.name, score: 1 };
        } else if (!bestMatch || score > bestMatch.score) {
            bestMatch = { name: encEntry.name, score };
        }
      });
  
      if (bestMatch && (bestMatch as BestMatch).score > 0) {
        // console.log(nonEncEntry.name, (bestMatch as BestMatch).name, (bestMatch as BestMatch).score);
        const output = {
            original: (bestMatch as BestMatch).name,
            updated: nonEncEntry.name,
            score: (bestMatch as BestMatch).score,
        }
        // finalMatches[nonEncEntry.name] = (bestMatch as BestMatch).name;
        finalMatches[(bestMatch as BestMatch).name] = output;
      }
    });
    return finalMatches;
  }

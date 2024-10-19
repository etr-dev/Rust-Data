import { IOffset } from "../../interfaces/offset.interface";
import { matchByName } from "./matchByName";
import { matchByOffsetProximity } from "./matchByOffset";
import { matchByType } from "./matchByType";

export const extractSurroundingContext = (
    entries: IOffset[],
    index: number,
    windowSize: number = 2
  ): IOffset[] => {
    const surroundingContext: IOffset[] = [];
  
    // Add preceding variables' types to context
    for (let i = Math.max(0, index - windowSize); i < index; i++) {
      surroundingContext.push(entries[i]);
    }
  
    // Add following variables' types to context
    for (let i = index + 1; i <= Math.min(index + windowSize, entries.length - 1); i++) {
      surroundingContext.push(entries[i]);
    }
  
    return surroundingContext;
  }
  
  export const matchByContext = (
    context1: IOffset[],
    context2: IOffset[],
  ) => {
    let similarityScore = 0;
    let totalScore = 0;
  
    // Compare context lengths and minimize iteration count
    const minLength = Math.min(context1.length, context2.length);

    for (let i = 0; i < minLength; i++) {
        // const [nameScore, nameReliability] = matchByName(context1[i].name, context2[i].name);
        const [typeScore, typeReliability] = matchByType(context1[i].type, context2[i].type);
        totalScore += 2;
        similarityScore += (typeScore * typeReliability); // * (nameScore * nameReliability);
    }
    return similarityScore/totalScore;
  }
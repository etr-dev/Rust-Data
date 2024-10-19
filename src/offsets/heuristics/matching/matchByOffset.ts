import { IOffset } from "../../interfaces/offset.interface";
import { Reliability, Score } from "../interfaces/scores.types";

function hexToDecimal(hexString: string): number {
    return parseInt(hexString, 16);
  }
  
export const matchByOffsetProximity = (offset1: string, offset2: string): [Score, Reliability] => {
    const offset1Value = hexToDecimal(offset1);
    const offset2Value = hexToDecimal(offset2);
    
    const offsetDifference = Math.abs(offset1Value - offset2Value);
  
    // Define a maximum difference where the score goes to zero (e.g., 500 bytes)
    const maxDifference = 500;
  
    // Calculate score based on proximity, where a smaller difference gives a higher score
    if (offsetDifference === 0) {
      return [1,1]; // Perfect match
    } else if (offsetDifference > maxDifference) {
      return [0,1]; // Too far apart
    } else {
      // Scale the score inversely proportional to the offset difference
      return [Math.min(1, (1 - offsetDifference / maxDifference)), 1];
    }
  }
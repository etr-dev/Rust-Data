import { readFileSync } from "fs";

export const loadFromCache = (filepath: string) => {
    const data = readFileSync(filepath, 'utf8');
    return JSON.parse(data);
}
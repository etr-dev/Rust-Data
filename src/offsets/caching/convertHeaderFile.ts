import { readFileSync } from "fs";
import { IOffset } from "../interfaces/offset.interface";
import { RustOffsets } from "../interfaces/rust.interface";

export const convertHeaderFileToOffets = (filepath: string) => {
    const data = readFileSync(filepath, 'utf8');
    const lines = data.split('\n');
    const offsets: Partial<RustOffsets> = {};
    let currentClass: string | null = null;
    let currentOffsets: IOffset[] = [];

    const classPattern = /namespace (\w+)/;
    const offsetPattern = /inline constexpr ::std::ptrdiff_t (\w+) = (0x[0-9A-Fa-f]+);(?: \/\/ (\w+))?/;

    for (const line of lines) {
        const classMatch = line.match(classPattern);
        const offsetMatch = line.match(offsetPattern);

        if (classMatch) {
            // Save previous class's offsets if any
            if (currentClass && currentOffsets.length > 0) {
            offsets[currentClass] = currentOffsets;
            }
            // Start a new class
            currentClass = classMatch[1];
            currentOffsets = [];
        } else if (offsetMatch && currentClass) {
            const [, name, offset, type = 'unknown'] = offsetMatch;
            currentOffsets.push({ name, type, offset });
        }
    }
    
    // Add the last class and offsets if present
    if (currentClass && currentOffsets.length > 0) {
        offsets[currentClass] = currentOffsets;
    }

    return offsets;
}
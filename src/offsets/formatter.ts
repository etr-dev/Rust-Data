import fs, { readFileSync, writeFileSync } from 'fs';
import { strict as assert } from 'assert';
import { IOffset } from './interfaces/offset.interface';
import { RustOffsets } from './interfaces/rust.interface';

export class Formatter {
    private offsets: RustOffsets;

    constructor(offsets: RustOffsets) {
        this.offsets = offsets;
    }

    toInlineHeaderFile(outputPath: string): void {
        let fileContent = '';

        const variableFormat = (input: {name: string; type: string; offset: string}) => {
            const { name, type, offset } = input;
            return `\t\tinline constexpr ::std::ptrdiff_t ${name} = ${offset}; // ${type}\n`;
        };

        fileContent += `#pragma once\n`;
        fileContent += `#include <cstdint>\n`;
        fileContent += `\n`;
        fileContent += `namespace RustOffsets {\n`;

        Object.keys(this.offsets).forEach(className => {
            fileContent += `\tnamespace ${className} {\n`;
            this.offsets[className].forEach(offset => {
                fileContent += variableFormat({ name: offset.name, type: offset.name, offset: offset.offset });
            });
            fileContent += `\t} // ${className}\n`;
        });

        fileContent += `}`;

        // Write the content to the file
        writeFileSync(outputPath, fileContent);
    } 
}

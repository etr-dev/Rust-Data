import fs, { readFileSync, writeFileSync } from 'fs';
import { strict as assert } from 'assert';
import { IOffset } from './interfaces/offset.interface';
import { RustOffsets } from './interfaces/rust.interface';

export class Formatter {
    private offsets: RustOffsets;
    private message = `Offsets updated by: https://github.com/erobin27/Rust-Data`

    constructor(offsets: RustOffsets) {
        this.offsets = offsets;
    }

    toInlineHeaderFile(outputPath: string): void {
        let fileContent = '';

        const variableFormat = (input: {name: string; type: string; offset: string}, tabs = 2) => {
            const { name, type, offset } = input;
            console.log(type);
            const tab = '\t'.repeat(tabs);
            return `${tab}inline constexpr ::std::ptrdiff_t ${name} = ${offset}; // ${type}\n`;
        };

        fileContent += `#pragma once\n`;
        fileContent += `#include <cstdint>\n`;
        fileContent += `\n`;
        fileContent += `// ${this.message}\n`;
        fileContent += `\n`;
        fileContent += `namespace RustOffsets {\n`;

        Object.keys(this.offsets).forEach(className => {
            if(!this.offsets[className]) return;

            if (Array.isArray(this.offsets[className])) {
                fileContent += `\tnamespace ${className} {\n`;
                (this.offsets[className] as IOffset[]).forEach(offset => {
                    fileContent += variableFormat(offset);
                });
                fileContent += `\t} // ${className}\n`;
            } else {
                const offset = this.offsets[className] as IOffset;
                fileContent += variableFormat({ name: offset.name, type: offset.name, offset: offset.offset }, 1);
            }
        });

        fileContent += `}`;

        // Write the content to the file
        writeFileSync(outputPath, fileContent);
    } 
}

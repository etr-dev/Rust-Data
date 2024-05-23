import fs, { readFileSync, writeFileSync } from 'fs';
import { strict as assert } from 'assert';
import { IOffset } from './interfaces/offset.interface';
import { RustOffsets } from './interfaces/rust.interface';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getBuildId } from '../steamcmd/update';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export class Formatter {
    private offsets: RustOffsets;
    private message?: string[];
    
    constructor(offsets: RustOffsets, message?: string[]) {
        this.offsets = offsets;
        this.message = message;
    }

    toInlineHeaderFile(outputPath: string): void {
        let fileContent = '';

        const variableFormat = (input: {name: string; type: string; offset: string}, tabs = 2) => {
            const { name, type, offset } = input;
            const tab = '\t'.repeat(tabs);
            return `${tab}inline constexpr ::std::ptrdiff_t ${name} = ${offset}; // ${type}\n`;
        };

        fileContent += `#pragma once\n`;
        fileContent += `#include <cstdint>\n`;
        fileContent += `\n`;
        this.message?.forEach(line => fileContent += `// ${line}\n`);
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

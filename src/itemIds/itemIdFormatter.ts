import {  writeFileSync } from 'fs';
import { IRustItemIds } from './itemIds.interface';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export class ItemIdFormatter {
    private itemIds: IRustItemIds;
    private message = `ItemIds updated by: https://github.com/erobin27/Rust-Data\n// ${dayjs().tz('America/New_York').format('dddd, M/D/YYYY - h:mm:ssA [EST]')}` // Friday, 5/17/2024 - 6:41:11PM EST


    constructor(itemIds: IRustItemIds) {
        this.itemIds = itemIds;
    }

    toInlineHeaderFile(outputPath: string): void {
        let fileContent = '';
        
        fileContent += `#pragma once\n`;
        fileContent += `#include <map>\n`;
        fileContent += `#include <string>\n`;
        fileContent += `\n`;
        fileContent += `// ${this.message}\n`;
        fileContent += `\n`;
        fileContent += `namespace RustItems {\n`;

        fileContent += `\tinline std::map<std::string, std::string> IdToName{\n`;
        Object.keys(this.itemIds.IdToName).map(key => {
            fileContent += `\t\t{"${key}", "${this.itemIds.IdToName[key]}"},\n`;
        })
        fileContent += `\t};\n`;

        fileContent += `\n`;
        
        fileContent += `\tinline std::map<std::string, int> NameToId{\n`;
        Object.keys(this.itemIds.NameToId).map(key => {
            fileContent += `\t\t{"${key}", ${this.itemIds.NameToId[key]}},\n`;
        })
        fileContent += `\t};\n`;


        fileContent += `} // RustItems`;

        // Write the content to the file
        writeFileSync(outputPath, fileContent);
    } 
}

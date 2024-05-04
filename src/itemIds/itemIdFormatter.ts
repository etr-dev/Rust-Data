import {  writeFileSync } from 'fs';
import { IRustItemIds } from './itemIds.interface';

export class ItemIdFormatter {
    private itemIds: IRustItemIds;
    private message = `ItemsIds updated by: https://github.com/erobin27/Rust-Data`

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

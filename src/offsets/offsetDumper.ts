import fs, { readFileSync } from 'fs';
import { strict as assert } from 'assert';
import { IOffset } from './interfaces/offset.interface';
import { IScriptJson } from './interfaces/scriptJson.interface';

export class OffsetDumper {
    private dumpPath: string;
    private dumpData;
    private scriptPath: string;
    private scriptData;

    constructor(dumpCsPath: string, scriptPath: string) {
        if (!dumpCsPath) throw new Error('Undefined dumpCsFilePath');

        this.dumpPath = dumpCsPath;
        const data = fs.readFileSync(dumpCsPath, 'utf8');
        this.dumpData = this.findAndTrimData(data, "public class BaseCombatEntity : BaseEntity");

        
        this.scriptPath = scriptPath;
        this.scriptData = fs.readFileSync(scriptPath, 'utf8');
    }

    private findAndTrimData(dumpData: string, searchTerm: string): string {
        const t = dumpData.indexOf(searchTerm);
    
        if (t === -1) {
            console.error("Failed to find excess splitter");
            assert(false, "Search term not found in dump data");
        }
    
        const startIndex = Math.max(t - 30, 0);
        return dumpData.substring(startIndex);
    }

    basicScan(className: string, staticMembers: boolean = false): IOffset[] {
        // const regex1 = /(public|private|protected|internal)\s(\w+\.?\w*\.?\w*)\s(\w+);\s\/\/\s(0x[0-9a-fA-F]+)/;
        // const regex2 = /(public|private|protected|internal)\s(\w+\.?\w.*)\s<(\w+)>.*?;\s\/\/\s(0x[0-9a-fA-F]+)/;
        // const regexList = /(public|private|protected|internal)\s(List<.*?>)\s(\w+);\s\/\/\s(0x[0-9a-fA-F]+)/;
        // const regexArray = /(public|private|protected|internal)\s(\w+\[\])\s(.*?);\s\/\/\s(0x[0-9a-fA-F]+)/;
        // const regexEntityRef = /(public|private|protected|internal)\s(EntityRef<\w+>)\s(\w+);\s\/\/\s(0x[0-9a-fA-F]+)/;
        // const regexStatic = /(public|private|protected|internal)\sstatic\s(\w+\.?\w*\.?\w*)\s(\w+);\s\/\/\s(0x[0-9a-fA-F]+)/;

        const regex1 = /(public|private|protected|internal)\s([%A-Za-z0-9]+\.?[%A-Za-z0-9\*]*?)\s([%A-Za-z0-9]+);\s\/\/\s(0x[0-9a-fA-F]+)?/; // works on 90%
        const regex2 = /(public|private|protected|internal)\s([%A-Za-z0-9+]+\s?<[%A-Za-z0-9]+>)\s?(.*)?;\s\/\/\s(0x[0-9a-fA-F]+)/; // works on stuff like Vector<int> and thing.thing<thing>
        const regexList = /(public|private|protected|internal)\s(List<.*?>)\s([%A-Za-z0-9]+);\s\/\/\s(0x[0-9a-fA-F]+)/; // only works on real List, append list to name
        const regexArray = /(public|private|protected|internal)\s([%A-Za-z0-9]+\[\])\s(.*?);\s\/\/\s(0x[0-9a-fA-F]+)/; // only works on arrays
        const regexEntityRef = /(public|private|protected|internal)\s(EntityRef<\w+>)\s(\w+);\s\/\/\s(0x[0-9a-fA-F]+)?/; // only works on entityrefs // REMOVED because hashed now
        const regexStatic = /(public|private|protected|internal)\sstatic\s([%A-Za-z0-9\.]*)\s([%A-Za-z0-9]+);\s\/\/\s(0x[0-9a-fA-F]+)?/;
        const regexReadonly = /(public|private|protected|internal)\sreadonly\s([%A-Za-z0-9]+\.?[%A-Za-z0-9]*?)\s([%A-Za-z0-9]+);\s\/\/\s(0x[0-9a-fA-F]+)?/;
        const regexGPT = /(public|private|protected|internal)\s+([%A-Za-z0-9]+\.?[%A-Za-z0-9]*?<[%A-Za-z0-9]+>)\s+([%A-Za-z0-9]+);\s+\/\/\s+(0x[0-9a-fA-F]+)/; // To get "BasePlayer.%70b3f71e35ad742e4d06db7f548b51eef7ff4323<ItemId>" as the type
        
        const idx = this.dumpData.indexOf(className);
        assert(idx !== -1, `Class name not found in dump data: ${className}`);

        const nextIdx = this.dumpData.indexOf("// Namespace:", idx + className.length);
        assert(nextIdx !== -1, `Next class namespace marker not found: ${className}`);

        const clazz = this.dumpData.substring(idx, nextIdx);

        const output: IOffset[] = [];
        clazz.split('\n').forEach(line => {
            const regexes = [
                regex1, regex2, regexList, regexArray, regexEntityRef, regexStatic, regexReadonly, regexGPT
            ];

            for (let regex of regexes) {
                const match = line.match(regex);
                if (match) {
                    const groups = match;
                    if (regex === regexStatic && !staticMembers) {
                        continue;
                    }
                    const offsetNum = groups[4];
                    const offsetType = groups[2];
                    let offsetName = groups[3];
                    if (regex === regexList && !offsetType.includes("List")) {
                        offsetName += "List";
                    }

                    const offset: IOffset = {type: offsetType, name: offsetName, offset: offsetNum};
                    output.push(offset);
                    break;
                }
            }
        });

        if (output.length === 0) {
            throw new Error(`No offsets found for ${className}, debugging needed.`);
        }

        return output;
    }

    scriptScan(classname: string): IOffset | undefined {
        const data: IScriptJson = JSON.parse(this.scriptData);
        const entry = data.ScriptMetadata.find(entry=> entry.Name===classname)
        if(!entry || !entry.Address) { 
            console.log(`${classname} NOT FOUND.`); 
            return undefined;
        }
        return { name: classname.replace(/[^\p{L}]/gu, '_'), offset: `0x${entry.Address.toString(16)}`, type: ''};
    }
}
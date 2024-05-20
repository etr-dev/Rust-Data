
import { Github } from "./github";
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { ItemIdFormatter } from "./itemIds/itemIdFormatter";
import { itemIds } from "./itemIds/ids";
import { dumpOffsets } from "./offsets/dumpScript";
import { existsSync, mkdirSync, readFile } from "fs";
import { parseVdf2Json, tempVDFText } from "./temp";
import { executeCommand } from "./misc/command";
import { hasBeenUpdated } from "./steamcmd/update";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dotenv.config();


interface ISteps {
    update: boolean;
    download: boolean;
    dump: boolean;
    offsets: boolean;
    itemIds: boolean;
    github_offsets: boolean;
    github_itemIds: boolean;
}

async function main(steps: ISteps) {
    // PART 1: Update Rust
    const logStep = (step: string, title: string) => {
        console.log('\n--------------------------------------');
        console.log(`${step}: ${title}`);
        console.log('--------------------------------------');
    }

    const setup = (path: string) => {
        if (!existsSync(path)) {
            mkdirSync(path);
        }
    }
    
    const rustInstallPath = `${process.cwd()}/rust_client`;
    const il2cppDumpOutputPath = `${process.cwd()}/il2cpp/output`;
    const outputPath = './output';
    const offsetOutputFile = `${outputPath}/rust.h`;// process.env.HEADER_OUTPUT as string;
    const itemIdOutputFile = `${outputPath}/rust_items.h`;
    const versionInfoOutput = `${outputPath}/version_info.txt`;
    const rustAppId = '252490';
    setup(outputPath);

    let hasUpdated = false;
    if (steps.update) {
        logStep('🔍', 'Checking if game has updated...');
        hasUpdated = await hasBeenUpdated(rustAppId, versionInfoOutput);
    }

    // If the game has updated or we are skipping the update check then continue
    if (hasUpdated || !steps.update) {
        //PART 1: Download and version check
        if (steps.download) {
            logStep('1️⃣', 'Downloading Rust');

            const updateRustCommand = `steamcmd +force_install_dir ${rustInstallPath} +login ${process.env.STEAM_USERNAME} ${process.env.STEAM_PW} +app_update 252490 validate +quit`;
            await executeCommand(updateRustCommand);
        }


        //PART 2: Run IL2CPP on Rust
        if (steps.dump) {
            logStep('2️⃣', 'IL2CPP Dump');

            const il2cppDumperExecPath = `${process.cwd()}/il2cpp/Il2CppDumper.exe`;
            const gameAssemblyPath = `${rustInstallPath}/GameAssembly.dll`
            const metadataPath = `${rustInstallPath}/RustClient_Data/il2cpp_data/Metadata/global-metadata.dat`
            const il2cppCommand = `${il2cppDumperExecPath} ${gameAssemblyPath} ${metadataPath} ${il2cppDumpOutputPath}`
            await executeCommand(il2cppCommand, ['/c']);
        }
        
        // PART 3: Dump the rust offsets
        if (steps.offsets) {
            logStep('3️⃣', 'Dump the rust offsets');

            const dumpCsPath = `${il2cppDumpOutputPath}/dump.cs`
            const scriptPath = `${il2cppDumpOutputPath}/script.json`
            dumpOffsets(dumpCsPath, scriptPath, offsetOutputFile);
            console.log('\t🚚 Offsets dumped: ', offsetOutputFile);
        }

        // PART 4: Dump the rust itemIds - TODO: make getting itemIds automated
        if (steps.itemIds) {
            logStep('4️⃣', 'Dump the item ids');

            const itemFormatter = new ItemIdFormatter(itemIds);
            itemFormatter.toInlineHeaderFile(itemIdOutputFile);
            console.log('\t🚚 ItemIds dumped: ', itemIdOutputFile);
        }

        // PART 5: Push offsets to github repo
        if (steps.github_offsets) {
            logStep('5️⃣', 'Push offsets to GitHub');

            const github = new Github('erobin27', 'Rust-DMA');
            const date = new Date();
            const time = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` 
            await github.commitFile(offsetOutputFile, 'RustDMA/SDK/rust.h', `Offset & ItemId Updates: ${time}`);
            console.log('Offsets comitted!', time);
        }

        // PART 6: Push itemids to github repo
        if (steps.github_itemIds) {
            logStep('6️⃣', 'Push item ids to GitHub');

            const github = new Github('erobin27', 'Rust-DMA');
            const date = new Date();
            const time = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` 
            await github.commitFile(itemIdOutputFile, 'RustDMA/SDK/rust_items.h', `ItemId Updates: ${time}`);
            console.log('Item Ids comitted!', time);
        }
    }

}

const steps: ISteps = {
    update: true,
    download: true,
    dump: true,
    offsets: true,
    itemIds: true,
    github_offsets: true,
    github_itemIds: true,
}

let count = 1;
const executeTask = async () => {
    const startTime = dayjs().tz('America/New_York');
    console.log(`🚀 Starting execution ${count} at ${startTime.format('M/D/YYYY - h:mm:ssA [EST]')}.`);
    let error;
    
    await main(steps).catch(err => error = err)

    const duration = dayjs.duration(dayjs().diff(startTime));
    error ? console.error(`\n❌ Failed execution ${count} in ${duration.format('HH:mm:ss')}.\n${error}\n`) : console.log(`\n✅ Finished execution ${count} in ${duration.format('HH:mm:ss')}.\n`);
    console.log('\n\n\n');
    count++;
}

const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
executeTask();
setInterval(executeTask, interval);
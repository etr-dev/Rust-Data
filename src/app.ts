
import { Github } from "./github";
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { ItemIdFormatter } from "./itemIds/itemIdFormatter";
import { itemIds } from "./itemIds/ids";
import { dumpOffsets } from "./offsets/dumpScript";

dotenv.config();


interface ISteps {
    download: boolean;
    checkVer: boolean;
    dump: boolean;
    offsets: boolean;
    itemIds: boolean;
    github_offsets: boolean;
    github_itemIds: boolean;
}

async function main(steps: ISteps) {
    // PART 1: Update Rust
    async function executeCommand(command: string, args: string[] = []) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, { shell: true });
    
            process.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
    
            process.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
    
            process.on('close', (code) => {
                console.log(`Process exited with code ${code}`);
                if (code === 0 || code === 3762504530) {
                    resolve(true);
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });
        });
    }

    const logStep = (step: string, title: string) => {
        console.log(`\nPART ${step}: ${title}`);
        console.log('--------------------------------------');
    }
    
    const rustInstallPath = `${process.cwd()}/rust_client`;
    const il2cppDumpOutputPath = `${process.cwd()}/il2cpp/output`;
    const offsetOutputFile = './output/rust.h';// process.env.HEADER_OUTPUT as string;
    const itemIdOutputFile = './output/rust_items.h';
    const versionInfoOutput = './output/version_info.txt';

    //PART 1: Download and version check
    if (steps.download) {
        logStep('1', 'Downloading Rust');

        const updateRustCommand = `steamcmd +force_install_dir ${rustInstallPath} +login ${process.env.STEAM_USERNAME} ${process.env.STEAM_PW} +app_update 252490 validate +quit`;
        await executeCommand(updateRustCommand);
    }

    if (steps.checkVer) {
        logStep('1B', 'Check game version command...');

        const checkGameVersionCommand = `steamcmd +login ${process.env.STEAM_USERNAME} ${process.env.STEAM_PW} +app_info_update 1 +app_info_print 252490 +quit > ${versionInfoOutput}`
        await executeCommand(checkGameVersionCommand);
    }


    //PART 2: Run IL2CPP on Rust
    if (steps.dump) {
        logStep('2', 'IL2CPP Dump');

        const il2cppDumperExecPath = `${process.cwd()}/il2cpp/Il2CppDumper.exe`;
        const gameAssemblyPath = `${rustInstallPath}/GameAssembly.dll`
        const metadataPath = `${rustInstallPath}/RustClient_Data/il2cpp_data/Metadata/global-metadata.dat`
        const il2cppCommand = `${il2cppDumperExecPath} ${gameAssemblyPath} ${metadataPath} ${il2cppDumpOutputPath}`
        await executeCommand(il2cppCommand);
    }
    
    // PART 3: Dump the rust offsets
    if (steps.offsets) {
        logStep('3', 'Dump the rust offsets');

        const dumpCsPath = `${il2cppDumpOutputPath}/dump.cs`
        const scriptPath = `${il2cppDumpOutputPath}/script.json`
        dumpOffsets(dumpCsPath, scriptPath, offsetOutputFile);
        console.log('Offsets dumped: ', offsetOutputFile);
    }

    // PART 4: Dump the rust itemIds - TODO: make getting itemIds automated
    if (steps.itemIds) {
        logStep('4', 'Dump the item ids');

        const itemFormatter = new ItemIdFormatter(itemIds);
        itemFormatter.toInlineHeaderFile(itemIdOutputFile);
        console.log('ItemIds dumped: ', itemIdOutputFile);
    }

    // PART 5: Push offsets to github repo
    if (steps.github_offsets) {
        logStep('5', 'Push offsets to GitHub');

        const github = new Github('erobin27', 'Rust-DMA');
        const date = new Date();
        const time = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` 
        await github.commitFile(offsetOutputFile, 'RustDMA/SDK/rust.h', `Offset & ItemId Updates: ${time}`);
        console.log('Offsets comitted!', time);
    }

    // PART 6: Push itemids to github repo
    if (steps.github_itemIds) {
        logStep('6', 'Push item ids to GitHub');

        const github = new Github('erobin27', 'Rust-DMA');
        const date = new Date();
        const time = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` 
        await github.commitFile(itemIdOutputFile, 'RustDMA/SDK/rust_items.h', `ItemId Updates: ${time}`);
        console.log('Item Ids comitted!', time);
    }
}

const steps: ISteps = {
    download: false,
    checkVer: false,
    dump: true,
    offsets: true,
    itemIds: false,
    github_offsets: false,
    github_itemIds: false,
}
main(steps).catch(console.error); 
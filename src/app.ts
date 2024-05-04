
import { Github } from "./github";
import { Formatter } from "./offsets/formatter";
import { RustOffsets } from "./offsets/interfaces/rust.interface";
import { OffsetDumper } from "./offsets/offsetDumper";
import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import { ItemIdFormatter } from "./itemIds/itemIdFormatter";
import { itemIds } from "./itemIds/ids";

dotenv.config();

const dumpOffsets = (dumpCsFilePath: string, scriptFilePath: string, outputFilePath: string) => {
    const dumper = new OffsetDumper(dumpCsFilePath, scriptFilePath);

    // Script Offsets
    const BaseEntity_TypeInfo = dumper.scriptScan('BaseEntity_TypeInfo');
    const Facepunch_Input_TypeInfo = dumper.scriptScan('Facepunch.Input_TypeInfo');
    const MainCamera_TypeInfo = dumper.scriptScan('MainCamera_TypeInfo');
    const System_Collections_Generic_List_BaseGameMode_TypeInfo = dumper.scriptScan('System.Collections.Generic.List\u003CBaseGameMode\u003E_TypeInfo');
    const BaseGameMode_TypeInfo = dumper.scriptScan('BaseGameMode_TypeInfo');

    // Class Offsets
    const BasePlayer = dumper.basicScan("public class BasePlayer : BaseCombatEntity, LootPanel.IHasLootPanel");
    const BaseEntity = dumper.basicScan("public class BaseEntity : BaseNetworkable, IProvider");
    const BaseCombatEntity = dumper.basicScan("public class BaseCombatEntity : BaseEntity");
    const BaseCorpse = dumper.basicScan("public class BaseCorpse : BaseCombatEntity");
    const LootableCorpse = dumper.basicScan("public class LootableCorpse : BaseCorpse, LootPanel.IHasLootPanel");
    const PlayerCorpse = dumper.basicScan("public class PlayerCorpse : LootableCorpse");

    const BuildingPrivlidge = dumper.basicScan("public class BuildingPrivlidge : StorageContainer");
    const BaseProjectile = dumper.basicScan("public class BaseProjectile : AttackEntity");
    const Magazine = dumper.basicScan("public class BaseProjectile.Magazine");
    const PlayerInventory = dumper.basicScan("public class PlayerInventory : EntityComponent<BasePlayer>");
    const ItemContainer = dumper.basicScan("public sealed class ItemContainer");
    const PlayerModel = dumper.basicScan("public class PlayerModel : ListComponent<PlayerModel>, IOnParentDestroying");
    const ModelState = dumper.basicScan("public class ModelState : IDisposable, Pool.IPooled, IProto");
    const Item = dumper.basicScan("public class Item //");
    const DroppedItem = dumper.basicScan("public class DroppedItem");
    const WorldItem = dumper.basicScan("public class WorldItem");
    const Model = dumper.basicScan("public class Model : MonoBehaviour, IPrefabPreProcess");
    const RecoilProperties = dumper.basicScan("public class RecoilProperties : ScriptableObject");
    const BaseFishingRod = dumper.basicScan("public class BaseFishingRod : HeldEntity");
    const FishingBobber = dumper.basicScan("public class FishingBobber : BaseCombatEntity");
    const OcclusionCulling = dumper.basicScan("public class OcclusionCulling : MonoBehaviour", true);
    const OcclusionCullin_DebugSettings = dumper.basicScan("public class OcclusionCulling.DebugSettings");
    const ItemDefinition = dumper.basicScan("public class ItemDefinition : MonoBehaviour");

    const offsets: RustOffsets = {
        BaseEntity_TypeInfo,
        Facepunch_Input_TypeInfo,
        MainCamera_TypeInfo,
        System_Collections_Generic_List_BaseGameMode_TypeInfo,
        BaseGameMode_TypeInfo,

        BasePlayer,
        BaseEntity,
        BaseCombatEntity,
        BaseCorpse,
        LootableCorpse,
        PlayerCorpse,
        BuildingPrivlidge,
        BaseProjectile,
        Magazine,
        PlayerInventory,
        ItemContainer,
        PlayerModel,
        ModelState,
        Item,
        ItemDefinition,
        DroppedItem,
        WorldItem,
        Model,
        RecoilProperties,
        BaseFishingRod,
        FishingBobber,
        OcclusionCulling,
        OcclusionCulling_DebugSettings: OcclusionCullin_DebugSettings,
    }

    const formatter = new Formatter(offsets);
    formatter.toInlineHeaderFile(outputFilePath);
}

function parseKeyValue(input: string): any {
    const stack: any[] = [{}];
    const lines = input.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));

    lines.forEach(line => {
        if (line.includes("{")) {
            const key = line.split("{")[0].trim().replace(/"/g, '');
            const newObject = {};
            if (key) stack[0][key] = newObject;
            stack.unshift(newObject);
        } else if (line.includes("}")) {
            stack.shift();
        } else {
            const parts = line.split(/"\s+"/).map(part => part.replace(/"/g, ''));
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(' ');
                stack[0][key] = value;
            }
        }
    });

    return stack.pop();
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

    
    const rustInstallPath = `${process.cwd()}/rust_client`;
    const il2cppDumpOutputPath = `${process.cwd()}/il2cpp/output`;
    const offsetOutputFile = './output/rust.h';// process.env.HEADER_OUTPUT as string;
    const itemIdOutputFile = './output/rust_items.h';
    const versionInfoOutput = './output/version_info.txt';

    if (steps.download) {
        console.log('PART 1: Downloading Rust');
        console.log('--------------------------------------');
        const updateRustCommand = `steamcmd +force_install_dir ${rustInstallPath} +login ${process.env.STEAM_USERNAME} ${process.env.STEAM_PW} +app_update 252490 validate +quit`;
        await executeCommand(updateRustCommand);
    }

    if (steps.checkVer) {
        console.log('\nPART 1B: Check game version command...');
        console.log('--------------------------------------');
        const checkGameVersionCommand = `steamcmd +login ${process.env.STEAM_USERNAME} ${process.env.STEAM_PW} +app_info_update 1 +app_info_print 252490 +quit > ${versionInfoOutput}`
        await executeCommand(checkGameVersionCommand);
    }


    //PART 2: Run IL2CPP on Rust
    if (steps.dump) {
        console.log('\nPART 2: IL2CPP Dump');
        console.log('--------------------------------------');
        const il2cppDumperExecPath = `${process.cwd()}/il2cpp/Il2CppDumper.exe`;
        const gameAssemblyPath = `${rustInstallPath}/GameAssembly.dll`
        const metadataPath = `${rustInstallPath}/RustClient_Data/il2cpp_data/Metadata/global-metadata.dat`
        const il2cppCommand = `${il2cppDumperExecPath} ${gameAssemblyPath} ${metadataPath} ${il2cppDumpOutputPath}`
        await executeCommand(il2cppCommand);
    }
    
    // PART 3: Dump the rust offsets
    if (steps.offsets) {
        console.log('\nPART 3: Dump the rust offsets');
        console.log('--------------------------------------');
        const dumpCsPath = `${il2cppDumpOutputPath}/dump.cs`
        const scriptPath = `${il2cppDumpOutputPath}/script.json`
        dumpOffsets(dumpCsPath, scriptPath, offsetOutputFile);
        console.log('Offsets dumped: ', offsetOutputFile);
    }

    // PART 4: Dump the rust itemIds - TODO: make getting itemIds automated
    if (steps.itemIds) {
        console.log('\nPART 4: Dump the item ids');
        console.log('--------------------------------------');
        const itemFormatter = new ItemIdFormatter(itemIds);
        itemFormatter.toInlineHeaderFile(itemIdOutputFile);
        console.log('ItemIds dumped: ', itemIdOutputFile);
    }

    // PART 5: Push offsets to github repo
    if (steps.github) {
        console.log('\nPART 5: Push offsets to GitHub');
        console.log('--------------------------------------');
        const github = new Github('erobin27', 'Rust-DMA');
        await github.commitFile(offsetOutputFile, 'RustDMA/SDK/rust.h', `Offset Updates: ${new Date().toISOString()}`);

        const date = new Date();
        const time = `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}` 
        await github.commitFiles([
            { filePath: offsetOutputFile, githubPath: 'RustDMA/SDK/rust.h'},
            { filePath: itemIdOutputFile, githubPath: 'RustDMA/SDK/rust_items.h'},
        ], `Offset & ItemId Updates: ${time}`)
        console.log('Offsets comitted!', time);
    }
}


interface ISteps {
    download: boolean;
    checkVer: boolean;
    dump: boolean;
    offsets: boolean;
    itemIds: boolean;
    github: boolean;
}

const steps: ISteps = {
    download: false,
    checkVer: false,
    dump: false,
    offsets: true,
    itemIds: false,
    github: true,
}
main(steps).catch(console.error); 
import { createDirectoryIfNotExists } from "../misc/createDirectory";
import { loadFromCache } from "./caching/loadFromCache";
import { Formatter } from "./formatter";
import { performHeuristicMatching } from "./heuristics/performHeuristicMatching";
import { RustOffsets } from "./interfaces/rust.interface";
import { OffsetDumper } from "./offsetDumper";
import { overrideNames } from "./overrides/override";

export interface HeurisiticMatching {
    enable: boolean;
    previousBuildId?: string;
    useHeuristicCache?: boolean;
}

export interface Paths {
    dumpCsFilePath: string;
    scriptFilePath: string;
    outputFilePath: string;
    heuristicOutputFilePath: string;
    cacheFileDirectory: string;
}

export const dumpOffsets = (paths: Paths, buildId: string, matching: HeurisiticMatching, message?: string[],) => {
    const { dumpCsFilePath, scriptFilePath, outputFilePath, cacheFileDirectory, heuristicOutputFilePath } = paths;
    const dumper = new OffsetDumper(dumpCsFilePath, scriptFilePath);

    // Script Offsets
    const BaseEntity_TypeInfo = dumper.scriptScan('BaseEntity_TypeInfo');
    const Facepunch_Input_TypeInfo = dumper.scriptScan('Facepunch.Input_TypeInfo');
    const MainCamera_TypeInfo = dumper.scriptScan('MainCamera_TypeInfo');
    const System_Collections_Generic_List_BaseGameMode_TypeInfo = dumper.scriptScan('System.Collections.Generic.List\u003CBaseGameMode\u003E_TypeInfo');
    const BaseGameMode_TypeInfo = dumper.scriptScan('BaseGameMode_TypeInfo');
    const LocalPlayer_TypeInfo = dumper.scriptScan('LocalPlayer_TypeInfo')

    // Class Offsets
    const BasePlayer = dumper.basicScan("public class BasePlayer : BaseCombatEntity");
    const BaseEntity = dumper.basicScan("public class BaseEntity : BaseNetworkable");
    const BaseCombatEntity = dumper.basicScan("public class BaseCombatEntity : BaseEntity");
    const BaseCorpse = dumper.basicScan("public class BaseCorpse : BaseCombatEntity");
    const LootableCorpse = dumper.basicScan("public class LootableCorpse : BaseCorpse, LootPanel");
    const PlayerCorpse = dumper.basicScan("public class PlayerCorpse : LootableCorpse");

    const BuildingPrivlidge = dumper.basicScan("public class BuildingPrivlidge : StorageContainer");
    const BaseProjectile = dumper.basicScan("public class BaseProjectile : AttackEntity");
    const Magazine = dumper.basicScan("public class BaseProjectile.Magazine");
    const PlayerInventory = dumper.basicScan("public class PlayerInventory : EntityComponent<BasePlayer>");
    const ItemContainer = dumper.basicScan("public class ItemContainer :");
    const PlayerModel = dumper.basicScan("public class PlayerModel : ListComponent<PlayerModel>");
    const ModelState = dumper.basicScan("public class ModelState : IDisposable, Pool.IPooled, IProto");
    const Item = dumper.basicScan("public class Item :");
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
        LocalPlayer_TypeInfo,

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

    const rawFormatter = new Formatter(offsets, message, overrideNames);
    createDirectoryIfNotExists(`${cacheFileDirectory}/builds/${buildId}`)
    rawFormatter.toCacheFile(`${cacheFileDirectory}/builds/${buildId}/${buildId}.json`);
    rawFormatter.toInlineHeaderFile(`${cacheFileDirectory}/builds/${buildId}/${buildId}.h`);
    rawFormatter.toInlineHeaderFile(outputFilePath);

    if (!matching.enable) return;

    const { previousBuildId } = matching;
    const previousOffsets = loadFromCache(`${cacheFileDirectory}/builds/${previousBuildId}/${previousBuildId}.json`);
    
    const heuristicOffsets = performHeuristicMatching({
        previousOffsets,
        currentOffsets: offsets,
    });

    const heuristicFormatter = new Formatter(heuristicOffsets, [...message as Array<string>, 'Based on heuristic offset comparisons. Use with caution.']);
    heuristicFormatter.toCacheFile(`${cacheFileDirectory}/builds/${buildId}/${buildId}_heur.json`);
    heuristicFormatter.toInlineHeaderFile(`${cacheFileDirectory}/builds/${buildId}/${buildId}_heur.h`);
    heuristicFormatter.toInlineHeaderFile(heuristicOutputFilePath);
}
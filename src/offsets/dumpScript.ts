import { Formatter } from "./formatter";
import { RustOffsets } from "./interfaces/rust.interface";
import { OffsetDumper } from "./offsetDumper";
import { overrideNames } from "./overrides/override";

export const dumpOffsets = (dumpCsFilePath: string, scriptFilePath: string, outputFilePath: string, message?: string[]) => {
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

    const formatter = new Formatter(offsets, message, overrideNames);
    formatter.toInlineHeaderFile(outputFilePath);
}
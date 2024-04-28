
import { Github } from "./github";
import { Formatter } from "./offsets/formatter";
import { RustOffsets } from "./offsets/interfaces/rust.interface";
import { OffsetDumper } from "./offsets/offsetDumper";
import dotenv from 'dotenv';

dotenv.config();

const dumpCsFilePath = process.env.DUMP_CS_PATH; // file path of dump.cs file from il2cppDumper
const dumper = new OffsetDumper(dumpCsFilePath as string);

const BasePlayer = dumper.basicScan("public class BasePlayer : BaseCombatEntity, LootPanel.IHasLootPanel");
const BaseEntity = dumper.basicScan("public class BaseEntity : BaseNetworkable, IProvider");
const BaseCombatEntity = dumper.basicScan("public class BaseCombatEntity : BaseEntity");
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
    BasePlayer,
    BaseEntity,
    BaseCombatEntity,
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
formatter.toInlineHeaderFile('./output/rust.h');

async function main() {
    const github = new Github('erobin27', 'Rust-DMA');
    const token = await github.getInstallationAccessToken();
    await github.commitFile('output/rust.h', 'RustDMA/SDK/rust.h', `Offset Updates: ${new Date().toISOString()}`);
    console.log('Offsets comitted!');
}

main().catch(console.error); 
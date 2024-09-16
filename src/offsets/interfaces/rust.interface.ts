import { IOffset } from "./offset.interface";

export interface RustOffsets {
    BaseEntity_TypeInfo?: IOffset;
    Facepunch_Input_TypeInfo?: IOffset;
    MainCamera_TypeInfo?: IOffset;
    System_Collections_Generic_List_BaseGameMode_TypeInfo?: IOffset;
    BaseGameMode_TypeInfo?: IOffset;
    LocalPlayer_TypeInfo?: IOffset;

    BasePlayer: IOffset[],
    BaseEntity: IOffset[],
    BaseCombatEntity: IOffset[],
    BaseCorpse: IOffset[],
    LootableCorpse: IOffset[],
    PlayerCorpse: IOffset[],
    BuildingPrivlidge: IOffset[],
    BaseProjectile: IOffset[],
    Magazine: IOffset[],
    PlayerInventory: IOffset[],
    ItemContainer?: IOffset[],
    PlayerModel: IOffset[],
    ModelState: IOffset[],
    Item: IOffset[],
    ItemDefinition: IOffset[],
    DroppedItem: IOffset[],
    WorldItem: IOffset[],
    Model: IOffset[],
    RecoilProperties: IOffset[],
    BaseFishingRod: IOffset[],
    FishingBobber: IOffset[],
    OcclusionCulling: IOffset[],
    OcclusionCulling_DebugSettings: IOffset[],

    [key: string]: IOffset[] | IOffset | undefined,
}
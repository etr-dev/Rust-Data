import { IVariable } from "../formatter";

const strictEqual = (first: string, second: string, ret: string) => {
    if (first === second) return ret;
};

const contains = (first: string, second: string, ret: string) => {
    if (first.includes(second)) return ret;
};

export const overrideNames = (variable: IVariable): string | undefined => {
    const { name, type, className, offset } = variable;

    let updatedName;

    updatedName = allOverrides(variable);

    switch (className) {
        case 'BasePlayer': updatedName = basePlayerOverrides(variable); break;
        case 'PlayerModel': updatedName = playerModelOverrides(variable); break;
        default:
            // console.warn(`The class that the variable is a part of is not supported: ${className}`);
    }

    if (updatedName) console.log(updatedName);
    return updatedName;
}

const basePlayerOverrides = (variable: IVariable): string | undefined => {
    const { name, type } = variable;
    let output;

    
    // console.log(name, type);
    return (
        strictEqual(name, '%c306008ca627b46d398b20cda76150fbd8ba72b8', 'bagCount') ??
        strictEqual(type, 'GameObject', '_lookingAt') ??
        contains(type, 'PlayerModel', 'playerModel') ??
        contains(type, '<PlayerInventory>', 'inventory') ??
        strictEqual(type, 'PlayerTeam', 'clientTeam') ??
        strictEqual(type, '%ba9edea0fbdb1007d59fa951cbc3bfb44cf2adbe', 'playerBelt') ??
        contains(type, '<ItemId>', 'clActiveItem') ??
        strictEqual(name, '%acf18949ed5327e2599b61085aa0f820e4e41fa0', 'userID') ??
        strictEqual(name, '%44238ac9255fe8df6def1f3294727acccdee69ec', 'userIDString') ??
        strictEqual(name, '%c4a07d30bc4bb435a1a1328dfc406a47a03278c4', '_displayName')
    );

}

const playerModelOverrides = (variable: IVariable): string | undefined => {
    const { name, type } = variable;
    let output;

    return (
        strictEqual(name, '%cf05a4f54a613d091ba0490b964fa2dd77fe6e3e', 'position') ??
        strictEqual(name, 'edd62eb271cd41db9bb79de04791062be9f88dee', '_smoothlookAngle')
    );

}

const allOverrides = (variable: IVariable): string | undefined => {
    const { name, type } = variable;
    return (
        strictEqual(type, 'BaseMovement', 'movement') ??
        strictEqual(type, 'ModelState', 'modelState')
    );

}
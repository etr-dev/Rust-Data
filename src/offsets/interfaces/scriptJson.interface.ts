interface ScriptJsonEntry {
    Address?: number;
    Name?: string;
    Signature?: string;
    TypeSignature?: string;
  }

export interface IScriptJson {
        ScriptMethod: ScriptJsonEntry[]
        ScriptString: ScriptJsonEntry[]
        ScriptMetadata: ScriptJsonEntry[]
        ScriptMetadataMethod: ScriptJsonEntry[]
        Addresses: ScriptJsonEntry[]
}
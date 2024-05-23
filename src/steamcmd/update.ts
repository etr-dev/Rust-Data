import { readFile, rename, renameSync } from "fs";
import { executeCommand } from "../misc/command";
import { parseVdf2Json } from "./vdf";

const readFileContent = (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        readFile(filePath, 'utf8', (err, data) => {
        if (err) {
        reject(err);
        } else {
        resolve(data);
        }
    });
    });
};

const extractBetweenBraces = (input: string): string => {
    const startIndex = input.indexOf('{');
    const endIndex = input.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      return input.slice(startIndex, endIndex + 1);
    }
  
    // If the braces are not found or are in the wrong order, return an empty string
    return '';
  }

// Function to extract the JSON-like portion of the output
const extractVdf = (output: string, steamAppId: string): string => {
    const mainVdf = extractBetweenBraces(output)
    const fixedVdf = mainVdf.replace('OK', '');
    const vdf = `"${steamAppId}"\n${fixedVdf}`;
    return vdf;
  };

export async function hasBeenUpdated(steamAppId: string, outputPath: string): Promise<boolean> {
    const tempPath = './temp.txt';
    let initialInstall = false;

    // Command to get game version
    const checkGameVersionCommand = `steamcmd +login anonymous +app_info_print ${steamAppId} +logoff +quit > ${tempPath}`;
    await executeCommand(checkGameVersionCommand);

    // Check the lastest app info from steam
    const file = await readFileContent(tempPath);
    const vdf = extractVdf(file, steamAppId);
    const json = parseVdf2Json(vdf);
    const publicBuildId = json[steamAppId].depots.branches.public.buildid;

    // Check the previous app info
    let previousPublicBuildId: string | undefined;

    try {
        const filePrevious = await readFileContent(outputPath);
        const vdfPrevious = extractVdf(filePrevious, steamAppId);
        const jsonPrevious = parseVdf2Json(vdfPrevious);
        previousPublicBuildId = jsonPrevious[steamAppId].depots.branches.public.buildid;
    } catch (err) {
        console.log('The previous app info was not found.');
        console.log('Setting up trigger for initial install.')
        initialInstall = true;
    }

    // Replace the saved app info with the latest read
    try {
        renameSync(tempPath, outputPath);
        console.log(`Saving app info to ${outputPath}.`);
    } catch (err) {
        console.error(`Error renaming ${tempPath} to ${outputPath}:`, err);
    }

    // Compare the latest and previous app info buildid to see if the app has updated
    const hasUpdated = publicBuildId !== previousPublicBuildId && publicBuildId && previousPublicBuildId;
    if (hasUpdated) {
        console.log(`Steam App has updated from buildid: ${previousPublicBuildId} to ${publicBuildId}.`);
    }
    if (initialInstall) {
        console.log(`Steam App has not been checked before, found buildid: ${publicBuildId}.`);
    }
    if (!hasUpdated && !initialInstall) {
    console.log(`Steam App has not changed buildid: ${publicBuildId}.`);
}

// respond with true if the app has updated or has not been checked before
return hasUpdated || initialInstall;
}

export async function getBuildId(steamAppId: string, outputPath: string): Promise<string> {
    // Check the previous app info
    let buildId: string | undefined;

    try {
        const filePrevious = await readFileContent(outputPath);
        const vdfPrevious = extractVdf(filePrevious, steamAppId);
        const jsonPrevious = parseVdf2Json(vdfPrevious);
        buildId = jsonPrevious[steamAppId].depots.branches.public.buildid;
    } catch (err) {
        console.log(err);
    }

    return buildId || '0';
}
  
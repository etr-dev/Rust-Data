import { existsSync, mkdirSync } from "fs";

export const createDirectoryIfNotExists = (dirPath: string) => {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`Directory ${dirPath} created.`);
    } else {
      console.log(`Directory ${dirPath} already exists.`);
    }
  }
import { spawn } from "child_process";

export async function executeCommand(command: string, args: string[] = []) {
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
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";

interface Secrets {
  appId: string;
  privateKey: string;
  installationId: string;
  clientId: string;
  clientSecret: string;
}

export class Github {
  private secrets: Secrets;
  private octokit: Octokit;
  private auth: ReturnType<typeof createAppAuth>;

  private username: string;
  private reponame: string;

  constructor(username?: string, reponame?: string) {
    if(!username || !reponame) {
      console.error('Missing GitHub name or project name: ', { username, reponame });
      throw new Error('Missing GitHub names.');
    }

    this.username = username;
    this.reponame = reponame;

    const appId = process.env.GITHUB_APP_ID;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const installationId = process.env.GITHUB_INSTALLATION_ID;
    const privateKeyPath = process.env.GITHUB_PEM_PATH;

    
    const missingVars = [];

    if (!appId) missingVars.push('GITHUB_APP_ID');
    if (!clientId) missingVars.push('GITHUB_CLIENT_ID');
    if (!clientSecret) missingVars.push('GITHUB_CLIENT_SECRET');
    if (!installationId) missingVars.push('GITHUB_INSTALLATION_ID');
    if (!privateKeyPath) missingVars.push('GITHUB_PEM_PATH');

    if (!appId || !clientId || !clientSecret || !installationId || !privateKeyPath) {
      console.error('Missing GitHub variables: ', missingVars);
      throw new Error('Missing GitHub authentication setup.');
    }

    const privateKey = readFileSync(privateKeyPath, 'utf8');

    this.secrets = {
      appId,
      privateKey,
      installationId,
      clientId,
      clientSecret,
    };

    this.auth = createAppAuth({
      appId: this.secrets.appId,
      privateKey: this.secrets.privateKey,
      clientId: this.secrets.clientId,
      clientSecret: this.secrets.clientSecret,
      installationId: parseInt(this.secrets.installationId, 10),
    });

    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.secrets.appId,
        privateKey: this.secrets.privateKey,
        installationId: parseInt(this.secrets.installationId, 10),
      },
    });
  }

  async getInstallationAccessToken() {
    const { token } = await this.auth({ type: "installation" });
    return token;
  }

  async createBlob(content: string) {
    const { data } = await this.octokit.git.createBlob({
      owner: this.username,
      repo: this.reponame,
      content,
      encoding: 'utf-8'
    });
    return data.sha;
  }

  async createTree(baseTreeSha: string, blobs: { path: string, sha: string }[]) {
    const { data } = await this.octokit.git.createTree({
      owner: this.username,
      repo: this.reponame,
      tree: blobs.map(blob => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      })),
      base_tree: baseTreeSha
    });
    return data.sha;
  }

  async createCommit(parentCommitSha: string, treeSha: string, message: string) {
    const { data } = await this.octokit.git.createCommit({
      owner: this.username,
      repo: this.reponame,
      message,
      tree: treeSha,
      parents: [parentCommitSha]
    });
    return data.sha;
  }

  async updateRef(commitSha: string, ref: string = 'heads/main') {
    await this.octokit.git.updateRef({
      owner: this.username,
      repo: this.reponame,
      ref,
      sha: commitSha
    });
  }

  async commitFile(filePath: string, githubPath: string, commitMessage: string) {
    console.log(`Committing ${filePath} to ${githubPath}`);
    const content = readFileSync(filePath, 'utf8');
    const blobSha = await this.createBlob(content);

    const { data: refData } = await this.octokit.git.getRef({
      owner: this.username,
      repo: this.reponame,
      ref: 'heads/main'
    });
    const baseTreeSha = refData.object.sha;

    const treeSha = await this.createTree(baseTreeSha, [{ path: githubPath, sha: blobSha }]);
    const commitSha = await this.createCommit(baseTreeSha, treeSha, commitMessage);
    await this.updateRef(commitSha);
  }

  async commitFiles(fileChanges: { filePath: string, githubPath: string }[], commitMessage: string) {
    const blobShas = await Promise.all(
      fileChanges.map(async change => ({
        path: change.githubPath,
        sha: await this.createBlob(readFileSync(change.filePath, 'utf8'))
      }))
    );

    const { data: refData } = await this.octokit.git.getRef({
      owner: this.username,
      repo: this.reponame,
      ref: 'heads/main'
    });
    const baseTreeSha = refData.object.sha;

    const treeSha = await this.createTree(baseTreeSha, blobShas);
    const commitSha = await this.createCommit(baseTreeSha, treeSha, commitMessage);
    await this.updateRef(commitSha);
  }
}

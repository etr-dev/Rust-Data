import { createAppAuth } from "@octokit/auth-app";
import { AuthInterface } from "@octokit/auth-app/dist-types/types";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";

export class Github {
  private secrets: {
    appId: string;
    privateKey: string;
    installationId: string;
    clientId: string;
    clientSecret: string;
  };

  private octokit: Octokit;
  private auth: AuthInterface;

  private username: string;
  private reponame: string;

  constructor(username: string, reponame: string){
    this.username = username;
    this.reponame = reponame;

    const appId = process.env.GITHUB_APP_ID as string;
    const clientId = process.env.GITHUB_CLIENT_ID as string;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET as string;
    const installationId = process.env.GIHUB_INSTALLATION_ID as string;
    const privateKey = readFileSync(process.env.GITHUB_PEM_PATH as string, 'utf8');

    if (!appId || !clientId || !clientSecret || !installationId || !privateKey) {
      throw new Error('Missing GITHUB auth setup.');
    }

    this.secrets = {
      appId,
      privateKey,
      installationId,
      clientId,
      clientSecret,
    }

    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: this.secrets
    });

    this.auth = createAppAuth(this.secrets);
  }

  async getInstallationAccessToken() {
    const installationAccessToken = await this.auth({ type: "installation" });
    return installationAccessToken.token;
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

  async createTree(baseTreeSha: string, path: string, blobSha: string) {
    const { data } = await this.octokit.git.createTree({
      owner: this.username,
      repo: this.reponame,
      tree: [
        {
          path,
          mode: '100644', // this is a typical file mode for non-executable files
          type: 'blob',
          sha: blobSha
        }
      ],
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
    const content = readFileSync(filePath, 'utf8');
    const blobSha = await this.createBlob(content);

    const { data: refData } = await this.octokit.git.getRef({
      owner: this.username,
      repo: this.reponame,
      ref: 'heads/main'
    });
    const baseTreeSha = refData.object.sha;

    const treeSha = await this.createTree(baseTreeSha, githubPath, blobSha);
    const commitSha = await this.createCommit(baseTreeSha, treeSha, commitMessage);
    await this.updateRef(commitSha);
  }
}
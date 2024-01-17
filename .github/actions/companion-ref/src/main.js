// const core = require('@actions/core')
// const github = require('@actions/github')
import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

function handleError(err) {
  console.error(err);

  if (err && err.message) {
    core.setFailed(err.message);
  } else {
    core.setFailed(`Unhandled error: ${err}`);
  }
}

process.on("unhandledRejection", handleError);

async function run() {
  const token = core.getInput("github-token", { required: true });
  const octokit = getOctokit(token);

  const branch = context.ref.replace("refs/heads/", "");

  const { data: commits } = await octokit.rest.repos.listCommits({
    owner: context.repo.owner,
    repo: context.repo.repo,
    sha: branch,
  });
  core.info(`Number of commits: ${commits.length}`);

  const merged = [];
  let result = "";
  for (const { sha } of commits) {
    const {
      data: { check_suites: checkSuites },
    } = await octokit.rest.checks.listSuitesForRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: sha,
    });
    const success = checkSuites.find(
      (c) => c.status === "completed" && c.conclusion === "success"
    );
    if (success) {
      result = success.head_sha;
      break;
    } else {
        merged.push(success.head_sha)
    }
  }
  core.info(`Successful Commit: ${result}`);
  core.info(`Merged commits before: ${merged}`)

  core.setOutput("result", result);
  core.setOutput("commits", merged)
}

run().catch(handleError);
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { existsSync, mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const workflows = Object.fromEntries(['mentions', 'review', 'ci-steward'].map(kind => [
  kind, readFileSync(join(__dirname, '../.github/workflows', `factory-${kind}.yml`), 'utf8'),
]));

function authorizationScript(kind) {
  const authorize = workflows[kind].split('\n  authorize:\n')[1].split(/\n  \w+:\n/)[0];
  const match = authorize.match(/^          script: \|\n((?:^            .*\n|^\n)+)/m);
  assert.ok(match, `Missing authorization script in ${kind}`);
  return match[1].replace(/^            /gm, '');
}

function pullRequest() {
  return {
    number: 42, state: 'open', draft: false,
    head: { sha: 'head-sha', ref: 'feature', repo: { full_name: 'jhd/project' } },
    base: { ref: 'main', sha: 'base-sha' },
  };
}

function eventContext(kind) {
  const pr = pullRequest();
  const payload = {
    repository: { default_branch: 'main' },
    sender: { login: 'writer', type: 'User' },
    action: kind === 'review' ? 'synchronize' : 'created',
    pull_request: pr,
  };
  if (kind === 'mentions') {
    payload.issue = { number: pr.number, state: 'open', pull_request: {} };
    payload.comment = {
      body: '@droid review', user: { login: 'writer', type: 'User' },
      author_association: 'MEMBER',
    };
  }
  if (kind === 'ci-steward') {
    payload.workflow_run = {
      event: 'pull_request', conclusion: 'failure',
      actor: { login: 'writer' }, triggering_actor: { login: 'writer' },
      head_repository: { full_name: 'jhd/project' },
      head_sha: pr.head.sha, head_branch: pr.head.ref,
      pull_requests: [{ number: pr.number }],
    };
  }
  return {
    repo: { owner: 'jhd', repo: 'project' }, actor: 'writer', runId: 100,
    eventName: kind === 'mentions' ? 'issue_comment' :
      kind === 'review' ? 'pull_request' : 'workflow_run',
    payload,
  };
}

async function authorize(kind, options = {}) {
  const context = options.context || eventContext(kind);
  const pr = options.pr || pullRequest();
  const result = { outputs: {}, failures: [], infos: [], permissions: [], jobs: [], pulls: [] };
  const github = {
    rest: {
      repos: {
        async getCollaboratorPermissionLevel({ username }) {
          result.permissions.push(username);
          return { data: { permission: options.permissions?.[username] || 'write' } };
        },
        async getContent(params) {
          assert.equal(params.path, '.github/droid-ci.yml');
          assert.equal(params.ref, 'main');
          if (options.configPresent) return { data: {} };
          throw Object.assign(new Error('Not Found'), { status: options.configError || 404 });
        },
      },
      pulls: {
        async get(params) {
          result.pulls.push(params.pull_number);
          assert.equal(params.owner, 'jhd');
          assert.equal(params.repo, 'project');
          return { data: pr };
        },
      },
      actions: {
        async listWorkflowRuns(params) {
          assert.equal(params.workflow_id, 'factory-review.yml');
          assert.equal(params.head_sha, pr.head.sha);
          assert.equal(params.event, 'pull_request');
          assert.equal(params.status, 'success');
          return { data: { workflow_runs: options.runs || [] } };
        },
        listJobsForWorkflowRun() { throw new Error('Use github.paginate for jobs'); },
      },
    },
    async paginate(method, { run_id }) {
      assert.equal(method, github.rest.actions.listJobsForWorkflowRun);
      result.jobs.push(run_id);
      return options.jobs?.[run_id] || [];
    },
  };
  const core = {
    setOutput: (key, value) => { result.outputs[key] = value; },
    setFailed: message => result.failures.push(message),
    info: message => result.infos.push(message),
  };
  await vm.runInNewContext(`(async () => {\n${authorizationScript(kind)}\n})()`, {
    github, context, core,
    process: { env: { TRIGGERING_ACTOR: options.triggeringActor || context.actor } },
  });
  return result;
}

function denied(result) {
  assert.equal(result.outputs.eligible, undefined);
}

function evaluate(expression, context, vars = {}) {
  const event = {
    changes: {}, comment: { user: {} }, review: { user: {} },
    ...context.payload,
  };
  return vm.runInNewContext(expression, {
    github: {
      event, actor: context.actor, event_name: context.eventName,
      repository: 'jhd/project', run_id: context.runId,
    },
    vars: {
      JHD_FACTORY_MENTIONS_ENABLED: 'true', JHD_FACTORY_REVIEW_ENABLED: 'true',
      JHD_FACTORY_STEWARD_ENABLED: 'true', ...vars,
    },
    fromJSON: JSON.parse,
    contains: (value, item) => value?.includes(item) || false,
    format: (value, ...args) => value.replace(/\{(\d+)\}/g, (_, index) => args[index]),
  });
}

function jobCondition(kind, context, vars) {
  const match = workflows[kind].match(/  authorize:\n    if: >-\n((?:      .*\n)+)/);
  assert.ok(match, `Missing authorize job condition in ${kind}`);
  return Boolean(evaluate(match[1], context, vars));
}

for (const kind of ['mentions', 'review', 'ci-steward']) {
  test(`${kind}: allows writers and verifies both actor identities`, async () => {
    const result = await authorize(kind, {
      triggeringActor: 'admin', permissions: { admin: 'admin' },
    });
    assert.equal(result.outputs.eligible, 'true');
    assert.deepEqual(result.failures, []);
    assert.deepEqual(result.permissions, ['writer', 'admin']);
    assert.deepEqual(result.pulls, [42]);
  });

  for (const permission of ['read', 'triage', 'none']) {
    for (const actor of ['writer', 'rerunner']) {
      test(`${kind}: rejects ${actor} with ${permission} permission`, async () => {
        const result = await authorize(kind, {
          triggeringActor: 'rerunner', permissions: { [actor]: permission },
        });
        denied(result);
        assert.equal(result.failures.length, 1);
        assert.match(result.failures[0], /repository writer/);
      });
    }
  }

  for (const state of ['fork', 'closed', ...(kind === 'mentions' ? [] : ['draft', 'stale'])]) {
    test(`${kind}: rejects ${state} PR`, async () => {
      const pr = pullRequest();
      if (state === 'fork') pr.head.repo.full_name = 'outside/project';
      if (state === 'closed') pr.state = 'closed';
      if (state === 'draft') pr.draft = true;
      if (state === 'stale') pr.head.sha = 'newer-head';
      const result = await authorize(kind, { pr });
      denied(result);
      assert.match(result.infos[0], /fork|superseded/);
    });
  }

  test(`${kind}: feature switch remains opt-in`, () => {
    const context = eventContext(kind);
    assert.equal(jobCondition(kind, context), true);
    const variable = kind === 'ci-steward' ? 'STEWARD' : kind.toUpperCase();
    assert.equal(jobCondition(kind, context, { [`JHD_FACTORY_${variable}_ENABLED`]: 'false' }), false);
  });
}

for (const eventName of ['issue_comment', 'pull_request_review_comment', 'pull_request_review']) {
  test(`mentions: authorizes a human ${eventName}`, async () => {
    const context = eventContext('mentions');
    context.eventName = eventName;
    if (eventName !== 'issue_comment') delete context.payload.issue;
    if (eventName === 'pull_request_review') {
      context.payload.review = context.payload.comment;
      delete context.payload.comment;
    }
    assert.equal(jobCondition('mentions', context), true);
    assert.equal((await authorize('mentions', { context })).outputs.eligible, 'true');
  });

  test(`mentions: rejects Factory bot output on ${eventName}`, async () => {
    const context = eventContext('mentions');
    context.eventName = eventName;
    context.actor = 'factory-droid[bot]';
    context.payload.sender = { login: context.actor, type: 'Bot' };
    context.payload.comment.user = context.payload.sender;
    if (eventName === 'pull_request_review') {
      context.payload.review = context.payload.comment;
      delete context.payload.comment;
    }
    assert.equal(jobCondition('mentions', context), false);
    const result = await authorize('mentions', { context });
    denied(result);
    assert.match(result.failures[0], /human/);
    assert.deepEqual(result.permissions, []);
  });
}

test('mentions: rejects bot rerunners without a Factory bypass', async () => {
  const result = await authorize('mentions', { triggeringActor: 'factory-droid[bot]' });
  denied(result);
  assert.match(result.failures[0], /human/);
});

for (const association of ['NONE', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR']) {
  test(`mentions: rejects author association ${association}`, async () => {
    const context = eventContext('mentions');
    context.payload.comment.author_association = association;
    assert.equal(jobCondition('mentions', context), false);
    denied(await authorize('mentions', { context }));
  });
}

test('mentions: rejects an actor who is not the comment author', async () => {
  const context = eventContext('mentions');
  context.actor = 'another-writer';
  assert.equal(jobCondition('mentions', context), false);
  denied(await authorize('mentions', { context }));
});

for (const body of ['@droid', '@droid review', '@droid fill', '@droid security', '@droid security --full']) {
  test(`mentions: rejects standalone issue command ${body}`, async () => {
    const context = eventContext('mentions');
    context.payload.comment.body = body;
    delete context.payload.issue.pull_request;
    delete context.payload.pull_request;
    const result = await authorize('mentions', { context });
    denied(result);
    assert.deepEqual(result.failures, []);
    assert.match(result.infos[0], /including full security scans, are PR-only/);
    assert.match(result.infos[0], /Ticket-to-PR is deferred/);
    assert.deepEqual(result.pulls, []);
    assert.deepEqual(result.permissions, []);
  });
}

function reviewRun(id = 99) {
  const pr = pullRequest();
  return { id, head_sha: pr.head.sha, pull_requests: [{ number: pr.number, base: pr.base }] };
}

for (const mismatch of ['other PR', 'base ref', 'base SHA', 'no associations', 'missing associations', 'missing base']) {
  test(`review: previous success with ${mismatch} does not suppress review`, async () => {
    const run = reviewRun();
    if (mismatch === 'other PR') run.pull_requests[0].number = 41;
    if (mismatch === 'base ref') run.pull_requests[0].base.ref = 'release';
    if (mismatch === 'base SHA') run.pull_requests[0].base.sha = 'old-base';
    if (mismatch === 'no associations') run.pull_requests = [];
    if (mismatch === 'missing associations') delete run.pull_requests;
    if (mismatch === 'missing base') delete run.pull_requests[0].base;
    const result = await authorize('review', {
      runs: [run], jobs: { 99: [{ name: 'Advisory review and security', conclusion: 'success' }] },
    });
    assert.equal(result.outputs.eligible, 'true');
    assert.deepEqual(result.jobs, []);
  });
}

test('review: same PR/head/base successful review deduplicates', async () => {
  const result = await authorize('review', {
    runs: [reviewRun()],
    jobs: { 99: [{ name: 'Advisory review and security', conclusion: 'success' }] },
  });
  denied(result);
  assert.deepEqual(result.failures, []);
  assert.deepEqual(result.jobs, [99]);
  assert.match(result.infos[0], /already completed/);
});

for (const jobs of [
  [], [{ name: 'authorize', conclusion: 'success' }],
  [{ name: 'Advisory review and security', conclusion: 'skipped' }],
  [{ name: 'Advisory review and security', conclusion: 'failure' }],
]) {
  test(`review: no completed successful review job (${JSON.stringify(jobs)}) remains eligible`, async () => {
    const result = await authorize('review', { runs: [reviewRun()], jobs: { 99: jobs } });
    assert.equal(result.outputs.eligible, 'true');
    assert.deepEqual(result.jobs, [99]);
  });
}

test('review: skips current run and continues past unrelated candidates', async () => {
  const unrelated = reviewRun(98);
  unrelated.pull_requests[0].number = 41;
  const result = await authorize('review', {
    runs: [reviewRun(100), unrelated, reviewRun()],
    jobs: { 99: [{ name: 'Advisory review and security', conclusion: 'success' }] },
  });
  denied(result);
  assert.deepEqual(result.jobs, [99]);
});

for (const part of ['ref', 'sha']) {
  test(`review: rejects superseded base ${part}`, async () => {
    const pr = pullRequest();
    pr.base[part] = 'different-base';
    denied(await authorize('review', { pr }));
  });
}

function reviewGroup(context) {
  const match = workflows.review.match(/^  group: (.*)\n/m);
  assert.ok(match);
  return match[1].replace(/\$\{\{(.*?)\}\}/g, (_, expression) => evaluate(expression, context));
}

test('review: title/body edits neither authorize nor cancel an active review', async () => {
  const current = eventContext('review');
  for (const changes of [{ title: { from: 'old' } }, { body: { from: 'old' } }]) {
    const edit = eventContext('review');
    edit.payload.action = 'edited';
    edit.payload.changes = changes;
    edit.runId = 101;
    assert.equal(jobCondition('review', edit), false);
    denied(await authorize('review', { context: edit }));
    assert.notEqual(reviewGroup(edit), reviewGroup(current));
    assert.notEqual(reviewGroup(edit), reviewGroup({ ...edit, runId: 102 }));
  }
});

test('review: base retargets authorize and share head/lifecycle cancellation group', async () => {
  const context = eventContext('review');
  const group = reviewGroup(context);
  context.payload.action = 'edited';
  context.payload.changes = { base: { ref: { from: 'release' }, sha: { from: 'old-base' } } };
  assert.equal(jobCondition('review', context), true);
  assert.equal((await authorize('review', { context })).outputs.eligible, 'true');
  assert.equal(reviewGroup(context), group);
  for (const action of ['opened', 'synchronize', 'reopened', 'ready_for_review', 'converted_to_draft', 'closed']) {
    context.payload.action = action;
    assert.equal(reviewGroup(context), group);
  }
});

for (const kind of ['review', 'ci-steward']) {
  test(`${kind}: preserves Factory bot trust for fix pushes`, async () => {
    const context = eventContext(kind);
    context.actor = 'factory-droid[bot]';
    context.payload.sender = { login: context.actor, type: 'Bot' };
    if (kind === 'ci-steward') {
      context.payload.workflow_run.actor.login = context.actor;
      context.payload.workflow_run.triggering_actor.login = context.actor;
    }
    assert.equal(jobCondition(kind, context), true);
    const result = await authorize(kind, { context });
    assert.equal(result.outputs.eligible, 'true');
    assert.deepEqual(result.permissions, []);
  });

  test(`${kind}: does not trust Dependabot`, async () => {
    const result = await authorize(kind, { triggeringActor: 'dependabot[bot]' });
    denied(result);
    assert.match(result.failures[0], /Only factory-droid/);
  });
}

test('ci-steward: checks original workflow actor and rerunner permissions', async () => {
  for (const role of ['actor', 'triggering_actor']) {
    const context = eventContext('ci-steward');
    context.payload.workflow_run[role].login = 'reader';
    const result = await authorize('ci-steward', { context, permissions: { reader: 'read' } });
    denied(result);
    assert.deepEqual(result.permissions, role === 'actor' ? ['reader'] : ['writer', 'reader']);
  }
});

test('ci-steward: rejects a superseded branch', async () => {
  const pr = pullRequest();
  pr.head.ref = 'other-branch';
  denied(await authorize('ci-steward', { pr }));
});

test('ci-steward: emits only the authorized head and refuses unaudited config', async () => {
  const result = await authorize('ci-steward');
  assert.deepEqual(result.outputs, { head_ref: 'feature', head_sha: 'head-sha', eligible: 'true' });
  const configured = await authorize('ci-steward', { configPresent: true });
  denied(configured);
  assert.match(configured.failures[0], /Audit .github\/droid-ci.yml/);
  await assert.rejects(authorize('ci-steward', { configError: 403 }), { status: 403 });
});

function jobBlock(kind, job) {
  const block = workflows[kind].split(`\n  ${job}:\n`)[1];
  assert.ok(block, `Missing ${job} job in ${kind}`);
  return block.split(/\n  \w[\w-]*:\n/)[0];
}

function gitHelperStep(kind, job) {
  const steps = jobBlock(kind, job).split('\n    steps:\n')[1].split(/\n(?=      - )/)
    .map(step => step.replace(/^      #.*\n/gm, '').replace(/\n      #.*$/gm, ''));
  const action = steps.findIndex(step => step.includes('uses: Factory-AI/droid-action@'));
  assert.ok(action > 0, `Missing native action in ${kind}/${job}`);
  assert.match(steps[action], /droid-action@ec767fcf5fac43b64e746cd42bb398b3b0b529ed /);
  assert.doesNotMatch(steps[action], /github_token|GITHUB_TOKEN|GH_TOKEN/);
  const helper = steps[action - 1].trim();
  assert.doesNotMatch(helper, /^\s+env:/m);
  const command = helper.match(/^\s+run: (.*)$/m);
  assert.ok(command, `Missing Git helper command in ${kind}/${job}`);
  return command[1];
}

function isolatedEnv(root, token = {}) {
  return {
    PATH: process.env.PATH, HOME: root,
    XDG_CONFIG_HOME: join(root, 'config'), XDG_CACHE_HOME: join(root, 'cache'),
    XDG_DATA_HOME: join(root, 'data'), XDG_STATE_HOME: join(root, 'state'),
    GH_CONFIG_DIR: join(root, 'gh'), GIT_CONFIG_GLOBAL: join(root, 'gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: '0', GIT_TERMINAL_PROMPT: '0',
    GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1',
    ...token,
  };
}

function run(command, args, env, input) {
  return spawnSync(command, args, { env, input, encoding: 'utf8', timeout: 20000 });
}

function credentialPassword(env) {
  const result = run('git', ['credential', 'fill'], env, 'protocol=https\nhost=github.com\n\n');
  return result.status === 0 ? result.stdout.match(/^password=(.*)$/m)?.[1] : undefined;
}

for (const [kind, job] of [['mentions', 'mentions'], ['ci-steward', 'steward']]) {
  test(`${kind}: authorization job does not configure Git credentials`, () => {
    assert.doesNotMatch(jobBlock(kind, 'authorize'), /setup-git/);
  });

  test(`${kind}: Git uses the native App token from the environment without storing it`, t => {
    const command = gitHelperStep(kind, job);
    const root = mkdtempSync(join(tmpdir(), 'factory-git-helper-'));
    t.after(() => rmSync(root, { recursive: true }));
    const setup = run('bash', ['-c', command], isolatedEnv(root));
    assert.equal(setup.status, 0, `setup-git failed: ${setup.stderr}`);
    assert.equal(credentialPassword(isolatedEnv(root)), undefined,
      'No credential is available before the native action supplies a token');
    for (const name of ['GITHUB_TOKEN', 'GH_TOKEN']) {
      const canary = `ghs_fakeCanary${name}${randomBytes(8).toString('hex')}`;
      assert.ok(credentialPassword(isolatedEnv(root, { [name]: canary })) === canary,
        `git credential fill did not return the ${name} canary`);
      for (const file of [join(root, 'gitconfig'), join(root, 'gh', 'hosts.yml')]) {
        assert.ok(!existsSync(file) || !readFileSync(file, 'utf8').includes(canary),
          `${file} stores a token value`);
      }
    }
  });
}

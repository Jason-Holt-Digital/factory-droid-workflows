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

function eligibilityScript(kind, job = 'authorize') {
  const match = jobBlock(kind, job).match(/^          script: \|\n((?:^            .*\n|^\n)+)/m);
  assert.ok(match, `Missing eligibility script in ${kind}/${job}`);
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
  const result = { outputs: {}, failures: [], infos: [], permissions: [], pulls: [] };
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
    },
  };
  const core = {
    setOutput: (key, value) => { result.outputs[key] = value; },
    setFailed: message => result.failures.push(message),
    info: message => result.infos.push(message),
  };
  await vm.runInNewContext(`(async () => {\n${eligibilityScript(kind, options.job)}\n})()`, {
    github, context, core,
    process: { env: { TRIGGERING_ACTOR: options.triggeringActor || context.actor } },
  });
  return result;
}

function denied(result) {
  assert.equal(result.outputs.eligible, undefined);
}

function evaluate(expression, context, vars = {}, scope = {}) {
  const event = {
    changes: {}, comment: { user: {} }, review: { user: {} },
    ...context.payload,
  };
  const script = expression
    .replaceAll('pull_requests[0].number', 'pull_requests?.[0]?.number')
    .replaceAll('labels.*.name', 'labels?.map(label => label.name)');
  return vm.runInNewContext(script, {
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
    ...scope,
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
    assert.deepEqual(result.pulls, kind === 'review' ? [42] : []);
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

  for (const state of kind === 'review' ? ['fork', 'closed', 'draft'] : []) {
    test(`${kind}: rejects ${state} PR`, async () => {
      const pr = pullRequest();
      if (state === 'fork') pr.head.repo.full_name = 'outside/project';
      if (state === 'closed') pr.state = 'closed';
      if (state === 'draft') pr.draft = true;
      const result = await authorize(kind, { pr });
      denied(result);
      assert.match(result.infos[0], /fork, draft, or closed/);
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
    const queued = await authorize('mentions', { context, job: 'mentions' });
    assert.equal(queued.outputs.eligible, 'true');
    assert.deepEqual(queued.pulls, [42]);
    assertMentionExecution(context, queued, true);
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

function assertMentionExecution(context, result, expected) {
  const steps = jobSteps('mentions', 'mentions');
  assert.match(steps[0], /uses: actions\/github-script@/);
  assert.ok(steps.some(step => step.includes('uses: Factory-AI/droid-action@')));
  for (const step of steps.slice(1)) {
    const condition = step.match(/^        if: (.*)$/m);
    const runs = condition ? Boolean(evaluate(condition[1], context, {}, {
      steps: { check: { outputs: result.outputs } },
    })) : true;
    assert.equal(runs, expected, step.split('\n')[0]);
  }
}

for (const state of ['closed', 'fork']) {
  test(`mentions: suppresses execution when the PR becomes ${state} while queued`, async () => {
    const context = eventContext('mentions');
    const pr = pullRequest();
    const authorized = await authorize('mentions', { context, pr });
    assert.equal(authorized.outputs.eligible, 'true');
    assert.deepEqual(authorized.pulls, []);
    if (state === 'closed') pr.state = 'closed';
    if (state === 'fork') pr.head.repo.full_name = 'outside/project';
    const queued = await authorize('mentions', { context, pr, job: 'mentions' });
    denied(queued);
    assert.deepEqual(queued.failures, []);
    assert.deepEqual(queued.permissions, []);
    assert.deepEqual(queued.pulls, [42]);
    assert.match(queued.infos[0], /fork or closed PRs/);
    assertMentionExecution(context, queued, false);
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

test('review: reviews the live head when the PR moved since the event', async () => {
  const pr = pullRequest();
  pr.head.sha = 'newer-head';
  const result = await authorize('review', { pr });
  assert.equal(result.outputs.eligible, 'true');
  assert.equal(result.outputs.head_sha, 'newer-head');
});

test('review: a PR labelled droid-reviewed is not reviewed again', async () => {
  const context = eventContext('review');
  context.payload.pull_request.labels = [{ name: 'droid-reviewed' }];
  assert.equal(jobCondition('review', context), false);
  const pr = pullRequest();
  pr.labels = [{ name: 'droid-reviewed' }];
  const result = await authorize('review', { pr });
  denied(result);
  assert.deepEqual(result.failures, []);
  assert.match(result.infos[0], /already has its Factory review/);
  assert.match(result.infos[0], /@droid review/);
});

test('review: other labels do not block the first review', async () => {
  const context = eventContext('review');
  context.payload.pull_request.labels = [{ name: 'enhancement' }];
  assert.equal(jobCondition('review', context), true);
  const pr = pullRequest();
  pr.labels = [{ name: 'enhancement' }];
  assert.equal((await authorize('review', { pr })).outputs.eligible, 'true');
});

test('review: a base retarget before the run still reviews the PR', async () => {
  const pr = pullRequest();
  pr.base.ref = 'different-base';
  assert.equal((await authorize('review', { pr })).outputs.eligible, 'true');
});

test('review: pushes restart an unlabelled review; edits do not start one', () => {
  const types = workflows.review.match(/^    types: \[(.*)\]$/m);
  assert.ok(types);
  const actions = types[1].split(',').map(action => action.trim());
  assert.deepEqual(actions, ['opened', 'synchronize', 'reopened', 'ready_for_review', 'converted_to_draft', 'closed']);
});

test('review: lifecycle events share one cancellation group per PR', () => {
  const match = workflows.review.match(/^  group: (.*)\n/m);
  assert.ok(match);
  const group = context => match[1].replace(/\$\{\{(.*?)\}\}/g, (_, expression) => evaluate(expression, context));
  const context = eventContext('review');
  const first = group(context);
  for (const action of ['synchronize', 'reopened', 'ready_for_review', 'converted_to_draft', 'closed']) {
    context.payload.action = action;
    context.runId += 1;
    assert.equal(group(context), first);
  }
});

test('review: labels the PR only after the review step', () => {
  const review = jobBlock('review', 'review');
  const reviewStep = review.indexOf('Run native deep review and security');
  const labelStep = review.indexOf('Mark the PR as reviewed');
  assert.ok(reviewStep > 0 && labelStep > reviewStep);
  assert.match(review.slice(labelStep), /labels: \[name\]/);
  assert.match(review, /ref: \$\{\{ needs\.authorize\.outputs\.head_sha \}\}/);
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

for (const association of ['present', 'empty', 'missing']) {
  test(`ci-steward: hands ${association} PR associations to native Steward`, async () => {
    const context = eventContext('ci-steward');
    if (association === 'empty') context.payload.workflow_run.pull_requests = [];
    if (association === 'missing') delete context.payload.workflow_run.pull_requests;
    assert.equal(jobCondition('ci-steward', context), true);
    const result = await authorize('ci-steward', { context });
    assert.deepEqual(result.outputs, { eligible: 'true' });
    assert.deepEqual(result.pulls, []);
    assert.deepEqual(result.failures, []);
    for (const job of ['authorize', 'steward']) {
      const group = jobBlock('ci-steward', job).match(/^      group: (.*)\n/m)[1];
      const actual = group.replace(/\$\{\{(.*?)\}\}/g, (_, expression) => evaluate(expression, context));
      const prefix = job === 'authorize' ? 'factory-steward-' : 'factory-ci-steward-';
      assert.equal(actual, prefix + (association === 'present' ? '42' : 'feature'));
    }
  });
}

test('ci-steward: refuses unaudited config and propagates API failures', async () => {
  const configured = await authorize('ci-steward', { configPresent: true });
  denied(configured);
  assert.match(configured.failures[0], /Audit .github\/droid-ci.yml/);
  await assert.rejects(authorize('ci-steward', { configError: 403 }), { status: 403 });
});

test('ci-steward: only hands same-repository failed PR workflows to native Steward', () => {
  for (const conclusion of ['failure', 'timed_out', 'success', 'cancelled', 'skipped']) {
    const context = eventContext('ci-steward');
    context.payload.workflow_run.conclusion = conclusion;
    assert.equal(jobCondition('ci-steward', context), ['failure', 'timed_out'].includes(conclusion));
  }
  const context = eventContext('ci-steward');
  context.payload.workflow_run.event = 'push';
  assert.equal(jobCondition('ci-steward', context), false);
  context.payload.workflow_run.event = 'pull_request';
  context.payload.workflow_run.head_repository.full_name = 'outside/project';
  assert.equal(jobCondition('ci-steward', context), false);
});

test('ci-steward: checks out the event branch and leaves head validation to native Steward', () => {
  const job = jobBlock('ci-steward', 'steward');
  assert.match(job, /ref: \$\{\{ github.event.workflow_run.head_branch \}\}/);
  assert.doesNotMatch(workflows['ci-steward'], /head_ref|EXPECTED_HEAD|needs.authorize.outputs.head_sha/);
});

function jobBlock(kind, job) {
  const block = workflows[kind].split(`\n  ${job}:\n`)[1];
  assert.ok(block, `Missing ${job} job in ${kind}`);
  return block.split(/\n  \w[\w-]*:\n/)[0];
}

function jobSteps(kind, job) {
  return jobBlock(kind, job).split('\n    steps:\n')[1].split(/\n(?=      - )/)
    .map(step => step.replace(/^      #.*\n/gm, '').replace(/\n      #.*$/gm, ''));
}

function gitHelperStep(kind, job) {
  const steps = jobSteps(kind, job);
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

async function runLabelStep(labelExists, liveHead = 'head-sha') {
  const review = jobBlock('review', 'review');
  const step = review.slice(review.indexOf('Mark the PR as reviewed'));
  const match = step.match(/          script: \|\n((?:^            .*\n|^\n)+)/m);
  assert.ok(match, 'Missing label step script');
  const calls = [];
  const github = {
    rest: {
      pulls: {
        async get() { return { data: { head: { sha: liveHead } } }; },
      },
      issues: {
        async getLabel(params) {
          calls.push(['get', params.name]);
          if (!labelExists) throw Object.assign(new Error('Not Found'), { status: 404 });
          return { data: {} };
        },
        async createLabel(params) { calls.push(['create', params.name]); },
        async addLabels(params) { calls.push(['add', params.issue_number, params.labels]); },
      },
    },
  };
  const context = eventContext('review');
  const core = { info: message => calls.push(['info', message]) };
  await vm.runInNewContext(`(async () => {\n${match[1].replace(/^            /gm, '')}\n})()`, {
    github, context, core, process: { env: { REVIEWED_SHA: 'head-sha' } },
  });
  return JSON.parse(JSON.stringify(calls));
}

test('review: creates the droid-reviewed label when the repository lacks it', async () => {
  assert.deepEqual(await runLabelStep(false), [
    ['get', 'droid-reviewed'], ['create', 'droid-reviewed'], ['add', 42, ['droid-reviewed']],
  ]);
  assert.deepEqual(await runLabelStep(true), [
    ['get', 'droid-reviewed'], ['add', 42, ['droid-reviewed']],
  ]);
});

test('wiki: generation runs only on the default branch', () => {
  const wiki = readFileSync(join(__dirname, '../.github/workflows/droid-wiki-refresh.yml'), 'utf8');
  const job = wiki.split('\n  wiki-refresh:\n')[1];
  assert.ok(job);
  const condition = job.match(/^    if: (.*)$/m);
  assert.ok(condition);
  for (const [ref, expected] of [['main', true], ['feature', false]]) {
    const value = vm.runInNewContext(condition[1].replaceAll('github.', 'github_.'), {
      github_: { ref_name: ref, event: { repository: { default_branch: 'main' } } },
    });
    assert.equal(value, expected);
  }
});

test('review: does not label a PR whose head moved during the review', async () => {
  const calls = await runLabelStep(true, 'newer-head');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'info');
  assert.match(calls[0][1], /moved during the review/);
});

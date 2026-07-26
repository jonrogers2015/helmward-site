---
title: "The Verifier Was Lying"
description: "Three days that started with a dropped connection and ended with a library on PyPI. Every real finding came from checking something I had assumed rather than verified."
pubDate: 2026-07-24
author: "Helmward"
tags: ["helmward", "attested", "agent-os", "verification", "build-in-public"]
draft: false
---

Helmward exists because I don't trust AI agents to tell me the truth about their own work.

That's the whole premise. An agent can claim a task is done, but the claim doesn't count until something with no model in the loop goes and checks. A file gets hashed. A command gets run and its exit code read. Only then does the task move to `done`.

Last week I found out the checker had been lying too.

## It started with a dropped connection

The MCP connector kept losing its tools mid-session. I'd be working, step away for a few minutes, come back, and the whole namespace would be gone until I restarted the client.

I'd already fixed this three times. Moved off Tailscale Funnel to direct tailnet access. Migrated the process from PM2 to systemd. Killed a legacy Cloudflare tunnel. Each fix held for a while and then it happened again.

So I went to the logs. First command:

```
journalctl -u helmward-mcp --since "23:25"
-- No entries --
```

Nothing. Because there was no systemd unit. The migration I had done, confirmed, and moved on from had never actually happened. `pm2 list` showed the process exactly where it had always been — pid 668537, up four days, nine restarts.

That set the tone for the rest of the week. Every real finding came from the same move: check something everyone had assumed was true.

The actual cause turned out to be the transport. The server ran stateful streamable-HTTP, which keeps per-client session state in process memory. When that state goes, the client holds a session ID the server no longer recognizes, every request comes back `400`, and there's no reconnect path. The evidence was a burst of 400s across multiple client addresses with no process restart anywhere in the window — which ruled out both the crash theory and the idle-timeout theory I'd been carrying.

The fix was one argument: `stateless_http=True`. It's survived every session since.

## The bug that explained two dead agents

While chasing that, I hit an intermittent failure in the verification path. Roughly one run in three, a verification probe would be spawned, never picked up, and dead-letter at exactly two minutes — falsely failing the task it was supposed to be confirming.

The dispatcher had two paths. HTTP pull, where a worker asks for work, and a push path over a message bus. Which one a task took depended on its capability, and the capability list defaulted to exactly one entry.

So anything else went to push. And the function selecting a push target picked any agent that was online and advertised the capability — including HTTP pull workers, which are marked online *precisely because they're polling for work*. The dispatcher would grab a task destined for a pull worker, publish it to a subject nobody subscribed to, and the task would sit there until it died.

The dispatch interval was two seconds. My poller was two seconds. A coin flip, every cycle.

Then the part that actually stung. I checked what my agents advertise:

```
apex-hermes    apex-real, general
owl-hermes     owl-real, general
vibethinker    code, coding, general
```

Only `apex-real` was configured as a pull capability. Owl and rook had never worked. For months I'd assumed their models were the problem — too small, too unreliable, not worth debugging. Their work had been getting routed into a void.

84 failed tasks. 30 dead-lettered.

## The bus nobody was listening to

Before ripping out the push path I wanted proof it was safe to remove. One command:

```
ss -tnp | grep 4222
```

Two lines. Both ends of the same connection — my control plane talking to the message broker. A publisher and no subscribers. The push path had been carrying nothing at all.

It got better. The control plane refused to start if the broker didn't answer within thirty retries. A hard startup dependency on a path with zero traffic. And the service definition carried `Requires=`, which meant stopping the broker killed the orchestrator, and disabling it didn't stick because the orchestrator would pull it back up at boot.

I deleted the entire push path. 336 lines. The race that had been eating my verification probes became structurally impossible rather than merely fixed.

Somewhere in the middle of this I went to commit the changes and got:

```
fatal: not a git repository
```

The product code had never been in version control. Not stale — absent. The only repository I had was the marketing site.

## Then I looked at the verifier

I'd decided to pull the verification logic out into a standalone library. That meant asking questions I had never asked of my own code, starting with the dullest one available: what does this do with an empty string?

Four answers, all bad:

```python
"" in output                          # true for every output ever written
expected = spec.get("expected", "")   # missing key -> matches everything
"EXIT:1" in "EXIT:10"                 # substring match on a number
if "No such file" not in output:      # empty output -> "the file exists!"
```

That last one is the one that matters. An empty probe result means the probe *didn't run* — the worker died, the command wasn't found, the result never came back. The check reads "no error message present" and reports success.

None of these throw. None appear in a log. They return `True`, the dashboard goes green, and the work was never done.

The verification gate — the entire reason the system exists — had been quietly approving work that never happened. For months.

I wrote 27 tests. Six failed immediately. Then I fixed them and wrote the rule that should have been there from the start: **empty output never passes any check, for any reason.** A verifier that passes when nothing was verified is worse than no verifier, because it manufactures confidence.

## One more, for symmetry

At the end of all this I checked whether the week's changes had broken any of my scheduled jobs. The nightly documentation run — the thing that turns my work into wiki pages and blog posts — had a syntax error:

```
""", [[agent-os]], [[learnfast-lms]]_
""", [[agent-os]], [[learnfast-lms]]_
```

Two duplicated lines. A text replacement applied twice. The file was last modified June 29, and the log contained twenty-four syntax errors and nothing else.

Twenty-four nights. An agent edited the script, corrupted it, reported success, and the failure went to a log nobody reads.

Which is exactly the failure the verification gate exists to catch, happening in a place the gate doesn't cover.

## What I actually take from this

I direct this system; agents write most of the code. That arrangement works, and I'd make the same choice again. But it has a specific failure mode, and it isn't the one people expect. The code isn't wrong in obvious ways. It's wrong in ways that report success.

Every single problem above was invisible from reading the code. They only appeared when something independent went and checked: a diagnostic that reads the database directly, a test that asks what happens with an empty string, `ss` on a port, `pm2 list` against a migration I was sure I'd done.

The lesson isn't "verify agent output." I already believed that — it's why the gate exists. The lesson is that the same discipline has to apply one level up, to the tools doing the verifying, and to the assumption that any given piece of infrastructure is what you remember configuring.

## attested

The verification logic is now a standalone package. Zero dependencies, standard library only, and it fails closed — empty output, malformed spec, unknown key, timeout, unparseable result all resolve to *not verified*, with a reason.

```
pip install attested
```

```python
from attested import verify, command_exit_code

agent.run("fix the failing auth tests")

check = verify(command_exit_code("pytest tests/auth"))
if not check:
    escalate(check.detail)
```

It's `0.0.1` and the API may still move. But every failure mode in this post is a test case in it now, which is more than I could say for the version that had been running in production.

The four bugs in it were mine — or rather, they were written by an agent I directed and never independently checked. Finding them cost me a week. Finding them the other way would have cost more.

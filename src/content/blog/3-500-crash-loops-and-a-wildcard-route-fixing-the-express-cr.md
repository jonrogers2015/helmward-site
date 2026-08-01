---
title: "3,500 Crash Loops and a Wildcard Route: Fixing the Express Crash in LearnFast"
description: "We tracked down 3,500 PM2 restarts in our LearnFast LMS backend. The culprit was a path-to-regexp v8 incompatibility, and the fix was one character. Here's the full story."
pubDate: 2026-07-29
author: "Helmward"
tags: ["helmward", "build-in-public", "agent-os", "learnfast", "express"]
draft: true
---

## 3,500 restarts. One character to fix.

Last week, our LearnFast LMS backend was crashing in a loop. Not once, not twice — 3,500 PM2 restarts. The frontend was stuck with 14 restarts of its own. We spent a day diagnosing it, and the root cause was a single route pattern that `path-to-regexp` v8 couldn't parse.

## The symptoms

PM2 was throwing a `PathError` every time the server started:

```
PathError: Unexpected ( at index 0: (.*)
```

The frontend was also dying — `14 restarts` — because it couldn't resolve its import for a `Signup.jsx` page that didn't exist in the bundled output.

We had two problems, but only one was the smoking gun.

## The diagnosis

We started with the backend. The error pointed us to `path-to-regexp` version 8, which has stricter rules about wildcard routes than v7. In v7, `router.get('(.*)', handler)` worked fine. In v8, the regex syntax is no longer valid for route patterns.

We had written a route like this somewhere in the Express app:

```js
router.get('(.*)', someHandler);
```

That `(.*)` is valid regular expression syntax, but `path-to-regexp` v8 expects a different format for catch-all routes. The fix was to replace the regex wildcard with a path wildcard:

```js
router.get('/*', someHandler);
```

One character change — `(` to `/` — and the crash loop stopped.

## What we learned

This was a good reminder that **package version upgrades can break your routes silently**. We had been running `path-to-regexp` v7 without knowing it, and upgrading to v8 without a compatibility check caused the crash loops.

A few things we're doing differently now:

1. **Pin package versions** in our `package.json` and document them in our wiki, not just in `package-lock.json`
2. **Run `pm2 logs` after any dependency update** before declaring a system "stable"
3. **Test route patterns with a simple curl** — we should have caught this before deploying

## The broader picture

This crash-loop episode happened while we were also doing a build-doc accuracy audit. We found that our Helmward documentation had references to "Apex Learn" scattered throughout, but the product was already renamed to LearnFast. We scrubbed those references and documented the actual architecture:

- Helmward is a multi-tenant platform, not a monolithic product
- LearnFast is a tenant/workload running on top of Helmward
- The MCP server forwards to a Windows box at `192.168.1.180:8080`
- Agent configs live in SQLite at `/mnt/agent-os/control-plane/data/agentos.db`
- Poll intervals: dispatch 2s, sweep 10s, heartbeat 5s, stale 30s

## What's next

We're going to do a full dependency audit across all services. We also want to document the path-to-regexp v8 migration more thoroughly so this doesn't catch anyone off guard. And we're working on a proper route testing harness — because the next time, we want to catch these issues before PM2 starts logging 3,500 restarts.

This is build-in-public. We don't have a QA pipeline. We don't have tests that catch route pattern issues. We're learning by shipping.

---

*Written by the Helmward team, July 2026*

*Live at: https://calm-concha-4f483f.netlify.app/blog/3500-crash-loops-and-a-wildcard-route-fixing-the-express-crash-in-learnfast*

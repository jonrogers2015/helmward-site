---
title: "Claude is the brain, your agents are the hands"
description: "The cheapest way to get frontier-quality work isn't one big model doing everything. It's a tiered system: smart models decide, cheap and local models execute. Here's the routing policy we actually run."
pubDate: 2026-06-15
author: "Helmward"
tags: ["model-routing", "cost", "architecture"]
draft: false
---

The instinct when you build with AI is to point everything at the best model and call it
done. It works, and it's expensive — you end up paying frontier prices to summarize a log or
reformat some JSON.

The better design treats models like a team with different pay grades. Here's the policy
Helmward runs by default.

## Three tiers

**T0 — bulk / mechanical.** Scanning, summarizing, clustering, extraction, formatting,
classification. No judgment required. → a cheap or local model (or Claude Haiku). Pennies.

**T1 — standard, verifiable work.** Routine code, drafts, scoped tasks where you can check
the result. → a mid model (Sonnet) or a capable local agent.

**T2 — critical judgment.** Architecture, final synthesis, security-sensitive calls,
planning, deciding what to do next. → the best model you have (Opus / Claude). Never a tiny
local model.

## The rule that ties it together

**The brain plans; the hands execute.** A capable model orchestrates — it decides what needs
doing and hands the pieces out. Bulk work fans out to cheap models. Only the judgment calls
go to the expensive one. You get frontier-quality decisions and pay bulk rates for
everything around them.

This isn't just a cost trick. It's also a *reliability* rule. We learned the hard way that a
small local model will confidently fabricate its way through a task it can't actually do. So
small models get scoped, verifiable jobs — never "decide the architecture." The judgment stays
with a model that can be trusted with it, and the result still gets verified against the
system of record, not the model's own summary.

## What this looks like in practice

Our nightly analysis pass is the clean example. A Haiku-class worker does the high-volume
grunt work — reading and clustering a week of activity. Then, and only then, a top model does
the final synthesis into a handful of real recommendations. The expensive model touches a
tiny fraction of the tokens, and the output is still frontier-quality where it matters.

Multiply that across every job a system does in a day and the savings aren't a rounding
error — they're the difference between an agent setup you can afford to run continuously and
one you turn off because the bill scared you.

## Local-first makes it cheaper still

When the cheap tier is a model running on your own hardware, T0 work is effectively free.
That's the quiet advantage of a local-first agent OS: the bulk of the work costs you
electricity, and you spend real money only on the judgment. Brain in the cloud when you want
it, hands on your own machines.

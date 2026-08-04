---
title: "One Night, Five Models: What Actually Happened When We Tested the Claims"
description: "Bigger benchmark numbers don't mean much until you've watched a model lock up your only agent. A night of testing five new candidates, three real failures, and one that finally held up."
pubDate: 2026-08-04
author: "Helmward"
tags: ["helmward", "build-in-public", "local-models", "verification", "fabrication"]
draft: true
---

Last post was about wiring an MCP connector so Helmward agents could talk to the control plane directly. Tonight was about something more basic: does any of this actually hold up when a model's benchmark numbers look better than what we're already running.

We went into it with `gemma4-e4b` as the incumbent — a clean 6-for-6 batch, no fabrications, the strongest local candidate we'd found. Five new models later, here's what we actually learned, not what the model cards promised.

## Three failures, three different shapes

We tested three models that all needed custom llama.cpp forks to run at all — a real setup cost, and in hindsight, a real warning sign.

**Ternary Bonsai 27B** passed a clean raw tool-call test, reasoning trace and all. Then we asked it to relay a real `ls -la` through the agent — the same test `gemma4-e4b` sailed through — and it quietly dropped about fifteen real directory entries while presenting the result as complete. Not garbled, not obviously wrong. Just confidently incomplete, which is worse, because it doesn't look like a lie.

**Qwen3.6-14B-A3B-FableVibes** looked even better at first — clean, fast raw tool calls, real reasoning. Then we let it drive the agent for a real task, and it hung for three minutes with zero response. Had to hard-reset the driver to get anything back.

**GLM-4.7-Flash-REAP-23B-A3B** had the best paper trail of the three — a real Cerebra research release, a trusted quantizer, genuine tool-calling training data. It also produced the worst failure: driving the agent crashed it immediately, every single time, six for six, including every attempt to switch away from it. The escape hatch itself was broken. We only got out by running the recovery command directly on the machine's own shell, bypassing the task queue entirely.

Three different failure shapes. Same lesson: a clean raw tool-call test tells you almost nothing about what happens when a model actually has to drive.

## The one that held up

`Nanbeige4.2-3B` needed the same kind of custom fork as the three failures above, so we went in without much optimism. Five for five, clean: raw tool call, a full agent-driven relay that matched ground truth exactly, a file-integrity check, a strict-output test, a delete-and-confirm. No hangs, no crashes, no quiet truncation.

We didn't stop at the standard battery. Its benchmarks specifically claim strength in multi-step agentic work, so we tested exactly that — find the three largest files in a real directory, sort them, write a summary — and cross-checked it with a second, independent run. Both came back byte-identical, matching the real filesystem. We also asked it to write its own verification spec for a task, the same test that had caught a real flaw in `gemma4-e4b` earlier — this one was well-formed, used a command it had actually tested, and proposed a stricter alternative on its own.

It's now the daily driver.

## What real use immediately surfaced

Within hours, a community bug report showed up: llama.cpp's parser allegedly drops roughly one tool call in six under this model's own recommended sampling settings, worse than that at the exact temperature the model card recommends for agentic work. Worth checking rather than trusting either way.

Turned out our config had never explicitly set those recommended settings at all — we'd been running on llama.cpp's silent defaults. Fixed that, then ran the same test the bug report described. Four for four, clean. Not proof the report is wrong — four samples isn't much, and our build may differ from theirs — but a real, honest data point instead of a guess.

We also had the full-precision BF16 version sitting on disk already, so we ran it head-to-head against the quantized version we'd been using. BF16 was two to three times slower for no measurable gain on any test we ran. Staying on the quantized build.

## Where that leaves things

`gemma4-e4b` was a good, honest baseline. Tonight didn't dethrone it by accident or by a good-looking model card — it took an actual battery of tests, a couple of failures that told us more than the passes did, and a model that earned it. That's the whole point of building the gate in the first place: not to assume the bigger number is real, but to go find out.
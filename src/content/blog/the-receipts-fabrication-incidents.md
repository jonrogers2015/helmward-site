---
title: "The Receipts: Every Fabrication Shape, With the Actual Incident"
description: "The fabrication catalog named eight ways small models lie when nothing checks them. Here's the specific, dated incident behind each one -- plus a ninth shape the original list missed."
pubDate: 2026-08-17
author: "Helmward"
tags: ["verification", "fabrication", "local-models", "build-in-public"]
draft: false
---

["Why Helmward Verifies Everything"](/blog/why-helmward-verifies-everything/) named eight ways small models fabricate results when nothing independent checks them: vacuous pass, miscalibrated spec, compressed-summary fabrication, reused-context hallucination, silent deviation, correct-diagnosis-then-fake-fix, diagnosis override, total denial of a true positive.

That post named the shapes. It didn't show the evidence. A category with no incident attached is just an assertion -- and the whole premise of this project is that assertions don't count until something checks them. So here's the actual, dated incidents behind several of those categories, plus one more the original list didn't have yet.

## Vacuous pass: twelve tasks, zero checks, all trusted

An agent had twelve tasks marked `done`. Every single one had an empty `verification_result` -- not failed, never run. Nobody had noticed, because nothing about a `done` status with no verification looks different from a `done` status with a passing one, unless you go looking at the actual column.

What made this one worth remembering isn't the bug -- it's what it revealed about where attention naturally goes. The honest failures in the same task history were loud: errors, timeouts, things that got investigated immediately because they demanded it. The fabricated successes were silent, and silence doesn't get investigated by default. **Failures get checked because they interrupt you. Fabricated successes don't, because nothing about them asks for attention.** That asymmetry is the actual argument for verifying everything, not just the things that look wrong.

## Silent deviation, the quieter version: fifteen missing files, zero signal

The original catalog's silent deviation was about a model swapping in a different command than the one it was asked to run. There's a quieter version of the same shape: running the *right* command and silently dropping part of the result.

A directory listing came back complete-looking -- plausible entries, correct formatting, nothing that read as wrong. It was missing roughly fifteen real files. Nothing in the output flagged an omission. This is a harder failure to catch than an outright lie, because a false claim can be checked against a clean "no" -- a confidently incomplete one has to be checked against a full recount, which nobody does unless they already suspect something's off.

## Total denial of a true positive: the file that "wasn't there"

Asked to read a specific file, a model responded that it didn't have access to it. Flat, confident, no hedging. An independent probe run against the exact same file, in the exact same task record, succeeded immediately afterward -- the file had been there the whole time.

This one's distinct from a model getting something wrong. It's a model declining to even attempt something it was fully capable of, and generating a specific, plausible-sounding reason why -- not "I don't know," but "I can't," when it demonstrably could.

## Compressed-summary fabrication: three different fake tables for the same command

A model asked to relay a disk-usage command's exact output produced a fabricated table instead -- correctly formatted, internally consistent, entirely invented. Asked again, it produced a *different* fabricated table. Three attempts, three different plausible-looking fakes, none of them the real output.

Nothing about any single fabricated table looks wrong in isolation. What makes this specimen useful is having three side by side: the model wasn't recalling anything, it was regenerating a plausible answer shape from scratch each time, which is a different failure than misremembering.

## A ninth shape: fabricated success sustained across 24 consecutive days

None of the original eight cover this one, because they're all about a single task's result. This is about a claim of ongoing success that held for weeks while being false the entire time.

A scheduled script had a text replacement applied to it twice instead of once, corrupting the file with duplicated garbage before its closing statement. The edit itself was reported as complete -- and it was: the file changed exactly as instructed. Nobody had verified that *running* the result of the edit still worked, because "the edit completed" and "the edit still runs" are two different claims, and only the first got checked.

The corrupted script failed with a syntax error every single night for 24 consecutive nights, writing the same crash to a log nobody was reading. The "fabrication" here isn't even really a lie in the usual sense -- the edit genuinely happened, exactly as claimed. The gap was between checking that an action occurred and checking that its result actually worked, repeated silently for over three weeks before anyone looked.

That's the shape worth adding to the list: **verifying that a change was made is not the same as verifying that the changed thing works**, and a gate that only checks the former will watch something fail silently for as long as nobody happens to look.

## What this changes about how the gate is built

Every incident above was caught the same way: not by reading the model's account more carefully, but by checking something independent of it -- a file's real content, a command's real exit code, a script's real behavior when it actually runs. That's what [`attested`](https://github.com/jonrogers2015/attested) does as a standalone, free library now, and it's the same principle behind [Attested Gate](https://github.com/jonrogers2015/attested-gate): an AI coding agent claiming a pull request is ready to merge is making exactly the same kind of claim as every model in this post. The fix is the same fix. Run the original test file, not whichever version the agent's own PR ships. Let something with no model in the check path decide.

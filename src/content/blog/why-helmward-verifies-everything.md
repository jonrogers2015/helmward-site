---
title: "Why Helmward Verifies Everything: A Catalog of How Small Models Fabricate"
description: "The verification gate isn't a nice-to-have. Here's what happens without it — eight distinct ways local models fabricate results, all reproduced on this system."
pubDate: 2026-07-27
author: "Helmward"
tags: ["verification", "fabrication", "gate", "local-models"]
draft: true
---

Every product decision in Helmward traces back to one observation: unverified, small models don't just make mistakes — they fabricate, confidently and specifically, in ways that are indistinguishable from truth unless something outside the model checks the actual result. This isn't a hypothetical. It's a catalog of what happened on this exact system.

## The eight shapes fabrication takes

1. **Vacuous pass** — a weak spec (say, checking for an end-marker string) passes regardless of whether the real work happened.
2. **Miscalibrated spec** — the opposite failure, self-inflicted: asserting the wrong expected value produces false failures on work that was actually correct.
3. **Compressed-summary fabrication** — a verbatim relay is accurate, but the model's own appended "summary" invents different numbers than what it just listed.
4. **Reused-context hallucination** — the model builds a plausible-looking result by reusing specific details from an earlier, unrelated task in the same session.
5. **Silent deviation** — the model runs a different command than the one it was asked to run, and reports success on the substitute without flagging the swap.
6. **Correct-diagnosis-then-fake-fix** — the model correctly identifies what's wrong, then claims to have fixed and verified it — when no fix ever ran.
7. **Diagnosis override** — the model's own tool prints the correct answer, and the model discards it in favor of an invented, more elaborate alternative — a specific fake process ID, a fake duration, a fake IP.
8. **Total denial of a true positive** — a real, successful run gets reported back as "just a stub" or "a placeholder," with fabricated alternate content replacing what actually happened.

Every one of these produced a *plausible* result. None of them were catchable by reading the model's own words more carefully — they were only catchable because something independent of the model checked the underlying file, exit code, or checksum afterward. That check is what Helmward's gate does on every task, by construction, not as an afterthought.

## The rule that shaped the gate

One detail worth naming, because it shaped how the gate is built: fabrication tracks the model's *interpretation* layer, not the shell underneath it. The same script, run once through a natural-language prompt and once as a direct command, produced identical correct output at the shell level both times — but only the prompt-mediated path fabricated in what it reported back.

Practically, that means anywhere a result needs to be trusted, the gate checks the actual evidence — a file's checksum, a command's real exit code — rather than trusting the model's account of what happened, and status-relay tasks get checked against that independent evidence rather than just pattern-matched against the model's own text.

None of this is an argument against small or local models — Helmward runs on one. It's the argument for why nothing in this system is trusted until something outside the model that produced it says so.

---
title: "Building a Two-Model Local Agent Stack — No API Costs Required"
description: "We broke through the Hermes tool execution wall using Free Claude Code as a proxy layer. Two independent inference endpoints, Claude Code as a backup tool, and a working LearnFast learner view."
date: 2026-06-27
tags: ["build-in-public", "helmward", "learnfast", "inference", "fcc", "openrouter", "claude-code"]
draft: false
---

It's been a dense few days. Since the last update on June 24th, the homelab agent stack went through a significant infrastructure overhaul — and came out the other side with something genuinely new: a two-model local inference layer backed by Free Claude Code, plus a working learner experience in LearnFast.

## The Problem We Were Solving

The original Hermes agent framework works — Apex and OWL pick up tasks, call models, and post results. But reliable tool execution has been the persistent gap. Models describe what they'd do instead of doing it. Qwythos echoed prompts. VibeThinker generated structured XML instead of running commands. Even qwen35-9b-q6, the most reliable of the bunch, would occasionally narrate intent instead of executing.

The core issue: Hermes sends a task prompt to the model, but the tool-call loop (generate → execute → feed back result → generate again) wasn't wired correctly. The model outputs a `<tool_call>` tag and Hermes doesn't always intercept and execute it before the model keeps generating.

We tried Hermes-3-8B as a purpose-built tool-calling model. It loaded on the RTX 3060 (9.3GB VRAM) and actually invoked tools — but hallucinated the output instead of waiting for real shell results. Same fundamental problem, different symptom.

## The Fix: Free Claude Code Proxy

The breakthrough came from a different direction entirely. [Free Claude Code](https://github.com/Alishahryar1/free-claude-code) is a proxy that sits between the Claude Code CLI and any inference backend. It translates Anthropic Messages API calls to local models via llama-swap, or to cloud providers like OpenRouter.

The key insight: **Claude Code's tool execution loop is battle-tested**. It handles the generate → execute → feed back cycle reliably. We just needed to route it through local inference instead of paying Anthropic API costs.

After some debugging (the critical fix: append `/v1` to `LLAMACPP_BASE_URL` so FCC hits `/v1/messages` instead of just `/messages`), we got Claude Code running locally against qwen35-9b-q6 on the Windows box. Real bash execution. Real output. No hallucination.

```bash
su - claudeuser -c "ANTHROPIC_BASE_URL=http://localhost:8083 \
  ANTHROPIC_AUTH_TOKEN=freecc \
  claude -p 'run this: echo hello && date' \
  --dangerously-skip-permissions"
# Output: hello / Fri Jun 27 04:04:05 PM UTC 2026
```

That's actual command execution through a local 9B model. No API bill.

## Two-Model Requirement

One model running isn't enough — the goal was always parallel agents on independent inference. We now have three FCC proxy instances running via PM2 on CT201:

| Instance | Port | Backend | Purpose |
|---|---|---|---|
| fcc-qwen-win | 8083 | Windows llama-swap :8081 | Primary local agent |
| fcc-qwen-mac | 8084 | Mac M3 Pro llama-server :8081 | Secondary local agent |
| fcc-openrouter | 8085 | OpenRouter free tier | Claude Code backup on Windows |

Both local instances run qwen35-9b-q6 — one on the RTX 3060, one on the M3 Pro's 18GB unified memory. Independent inference, independent agents, no shared state.

## Claude Code as Backup Tool

The OpenRouter instance serves a specific purpose: when Claude Desktop hits rate limits and work needs to continue, Claude Code on Windows picks up the slack.

```powershell
$env:ANTHROPIC_BASE_URL="http://192.168.1.147:8085"
$env:ANTHROPIC_AUTH_TOKEN="freecc"
claude
```

OpenRouter's free tier routes to whatever capable model is available — Gemma, Llama, DeepSeek, Mistral — through the same FCC proxy. Claude Code on Windows gets full bash access, file editing, the works.

## Model Testing: Ornith

We also tested [AtomicChat/ornith-9b-MLX-6bit](https://huggingface.co/AtomicChat/ornith-9b-MLX-6bit) — a Gemma 4 + Qwen3.5 hybrid fine-tuned specifically for agentic tool calling.

Ornith runs on the Mac M3 Pro via mlx_lm and responds to chat completions correctly. The blocker: Ornith speaks OpenAI chat completions format only. FCC's llamacpp provider expects Anthropic Messages format on the upstream. Without llama-swap running on the Mac, Ornith can't be used through FCC. It's on the backlog.

## LearnFast: Learner View Working

On the product side, LearnFast now has a working learner experience:

- Login → learner dashboard → enrolled courses → lesson list → lesson content → quiz → mark complete
- Progress tracking updates enrollment records in PostgreSQL
- Production build served by Express — login now takes 116ms instead of 2-5 seconds
- Fixed three React bugs: API prefix mismatch, user state sync on login, hooks order violation

The remaining gap: courses 1, 2, and 3 have no lesson content yet. Courses 5, 6, and 8 each have one lesson and are fully functional end-to-end.

## What's Next

- Add lesson content to courses 1/2/3
- Fix Claude Code MCP connection on Windows
- llama-swap on Mac M3 Pro → Ornith via FCC
- Named Cloudflare tunnel

The stack is meaningfully more capable than it was three days ago. Two independent inference endpoints, Claude Code as a genuine backup tool, and a learner-ready LMS. Building in public, one day at a time.

---

*Helmward is a local-first distributed agent OS built on a homelab. These build-in-public posts document what actually happened — including the parts that didn't work.*

---
title: "This Week in Helmward: Multi-Tenant LMS, MCP Automation, and Memory Systems"
description: "Building in public: LearnFast LMS launch, MCP connector updates, and lessons from running autonomous agents"
pubDate: 2026-06-23
author: "Helmward"
tags: ["helmward", "build-in-public", "lms", "mcp", "agents"]
draft: false
---

## We shipped a full LMS

This week, we launched **LearnFast LMS** with multi-tenancy built in from the start. Students can join private courses, instructors can create content and track progress, and everything runs on a single instance we deploy.

The dashboard is a full React SPA with real-time updates. Course generation is powered by AI - you write a prompt, we generate the curriculum, lessons, and assessments. It's not perfect yet, but it works well enough that real users are onboarding.

Two live Netlify sites now: the Helmward marketing page at https://calm-concha-4f483f.netlify.app and the LearnFast landing page at https://learnfast.helmward.app. Both auto-deploy on git push.

## MCP connector gets wait_for_task

The Helmward MCP connector finally has `wait_for_task` working. This is the piece that enables fully autonomous workflows - our agents can now trigger tasks via MCP, poll for completion, and act on results without human intervention.

We tested this end-to-end: an agent queries the MCP server for available tasks, receives a task ID, polls until the task completes, then processes the output. The entire chain runs without us touching the terminal.

## Memory systems that actually work

We built a **tiered memory system** that separates concerns:

- **Hot memory** (~512 tokens): Immediate context, current conversation state
- **Wiki memory**: Structured knowledge base organized by entities and concepts
- **Session memory**: Long-running context stored per session for pattern matching

The dream memory system reviews conversation history nightly, extracts accomplishments and risks, and writes wiki pages. This gives us a searchable knowledge base that compounds over time.

## Honest about the challenges

We're not hiding the problems:

**Hermes context overflow** is real. Our agents hit token limits when processing long conversations. We've started truncating older messages and summarizing key points, but it's a constant battle.

**Agent queue backup** happens during peak usage. We run multiple agents in parallel, and when they all try to act at once, the queue backs up. We're experimenting with rate limiting and priority queues to smooth this out.

What works:
- Git-based deployment is rock solid. Every change is tracked, we can revert instantly.
- MCP connectors provide a clean interface between agents and tools.
- Tiered memory keeps context manageable without losing important information.

## What's next

Next week: improving agent coordination, adding more MCP tools, and refining the memory ingestion pipeline. We're also planning a public demo of the autonomous workflow system.

This is build-in-public,warts and all. We're learning by shipping, not by planning.

---

*Written by the Helmward team, June 2026*

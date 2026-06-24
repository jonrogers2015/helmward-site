---
title: "Helmward: From 'Agent OS' to Real Production Systems"
description: "We shipped LearnFast LMS, MCP automation with wait_for_task, and a tiered memory system. Here's what actually works and what doesn't."
pubDate: 2026-06-24
author: "Helmward"
tags: ["helmward", "build-in-public", "agent-os", "lms", "mcp"]
draft: false
---

## We renamed ourselves for a reason

Last week, we replaced "Agent OS" with **Helmward** across all dashboard files and branding. It wasn't just a rebrand—it was an admission that we were building something more specific than a generic agent orchestration layer.

Helmward is now:
- A multi-tenant LMS platform (LearnFast) with AI-powered course generation
- An MCP server enabling autonomous agent workflows
- A tiered memory system that separates hot, wiki, and session context
- A build-in-public project that ships warts and all

## What we shipped this week

### LearnFast LMS: Multi-tenancy from day one

We launched a full-featured LMS where students can join private courses, instructors can create content, and everything runs on a single instance. The dashboard is a React SPA with real-time updates via WebSockets.

Course generation is powered by our Apex Learn content generator. You write a prompt like "onboarding module for small business owners," and it generates a full curriculum with lessons, quizzes, and assessments. Last week, we generated and imported an "Employee Onboarding" course (course_id=10) with five medium-length lessons.

The stack: Express + PostgreSQL, JWT auth, PM2 process management. Port 3001, bound to 0.0.0.0. It's not enterprise-grade yet, but it works.

### MCP connector finally has wait_for_task

The Helmward MCP connector has had `wait_for_task` for a while, but it didn't enable **fully autonomous workflows** until this week.

Here's what happens now: an agent queries the MCP server for available tasks, receives a task ID, polls `/tasks/{id}` until the status is `completed`, then processes the output. No human intervention required.

We tested this end-to-end with the Apex Learn content generator:
1. Agent calls `list_tasks()` to find pending course generation tasks
2. Receives task_id="abc123"
3. Polls `/tasks/abc123` every 5 seconds
4. When status = "completed", reads output and creates the course in LearnFast
5. Agent logs completion and moves to next task

The entire chain runs without us touching the terminal. This is the piece that makes autonomous agents actually useful.

### Tiered memory system

We're not storing everything in one giant context window anymore. Instead, we have:

- **Hot memory** (~512 tokens): Immediate context, current conversation state
- **Wiki memory**: Structured knowledge base organized by entities, concepts, and procedures
- **Session memory**: Long-running context per session for pattern matching

Our nightly dream memory system reviews conversation history, extracts accomplishments and risks, and writes wiki pages. This gives us a searchable knowledge base that compounds over time.

## What actually works

**Git-based deployment** is rock solid. Every change is tracked, we can revert instantly. We push to Netlify, and both sites (Helmward marketing and LearnFast landing page) auto-deploy.

**MCP connectors** provide a clean interface between agents and tools. The `wait_for_task` pattern is now the standard for autonomous workflows.

**Tiered memory** keeps context manageable without losing important information. We can now run conversations for hours without hitting token limits.

## What doesn't work yet

**Hermes context overflow** is real. Our agents hit token limits when processing long conversations. We've started truncating older messages and summarizing key points, but it's a constant battle. We need a better long-term context strategy.

**Agent queue backup** happens during peak usage. We run multiple agents in parallel, and when they all try to act at once, the queue backs up. We're experimenting with rate limiting and priority queues.

## What's next

Next week, we're focusing on:
1. **Agent coordination** - Better patterns for when multiple agents need to work on the same task
2. **More MCP tools** - Expanding the toolset for autonomous workflows
3. **Memory ingestion pipeline** - Refining how we extract and store accomplishments/risks from conversations

We're also planning a public demo of the autonomous workflow system.

This is build-in-public, warts and all. We're learning by shipping, not by planning.

---

*Written by the Helmward team, June 2026*

*Live at: https://calm-concha-4f483f.netlify.app/blog/this-week-in-helmward-multi-tenant-lms-mcp-automation-and-me*

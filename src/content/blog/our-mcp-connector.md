---
title: "An MCP connector for our Helmward agents"
description: "We built a FastMCP wrapper so Helmward agents can fire tasks through the control plane and get structured verification back."
pubDate: 2026-08-03
author: "Helmward"
tags: ["helmward", "build-in-public", "agent-os", "mcp"]
draft: false
---

Two weeks ago we shipped the Helmward control plane — a small REST service that dispatches tasks to agents, tracks attempts, and verifies results. We also had an MCP server sitting at `/root/helmward-mcp/server.py`, but it was a stub. No tools, no verification spec, nothing.

Last week we fixed that.

The connector is a FastMCP server that exposes four tools: `create_task`, `get_task`, `list_tasks`, and `list_agents`. The interesting part is `create_task`, which accepts an optional `verification_spec`. Here's the schema:

```python
verification_spec: {
    "type": "file_exists",     "path": "/etc/hosts",     "min_bytes": 100
}
```

or

```python
verification_spec: {
    "type": "command_output_contains",
    "command": "docker ps",
    "expected": "nginx"
}
```

or

```python
verification_spec: {
    "type": "command_exit_code",
    "command": "systemctl is-active nginx",
    "expected_exit_code": 0
}
```

When a task is created with a verification spec, the control plane does NOT mark the task done on the agent's word alone. It independently runs the verification after the agent reports completion, and only then finalizes the status. Use this for anything that changes real state — writes a file, restarts a service, etc.

We chose verification specs over a raw `write_file` tool in the MCP because the write path through the LLM is what introduces hallucination. With specs, the LLM never sees the ground truth; it just sees a prompt and a verification rule.

We also added `capability` routing. A task can be sent to `apex-real`, `rook-hermes`, or any registered capability. The control plane assigns it based on load and capability availability.

One concrete lesson: the first version of the connector didn't set `Content-Type: application/json` on its requests. The control plane accepted it, but every response came back as a 200 with empty JSON. Adding the header was a single line, but it cost us about an hour of debugging because the logs showed nothing useful — the endpoint was just not responding to our queries.

The connector is running on `127.0.0.1:8080` behind the Helmward API.

What's next: we want to add a `write_file` tool with checksum verification, and we're exploring whether the verification spec schema should support `file_checksum` so agents can be asked to write a specific hash rather than a specific content. That keeps the LLM out of the verification path entirely.

---
title: "768 Restarts in 8 Seconds: When Our LMS Started Dying"
description: "A critical incident in our LearnFast LMS backend taught us about race conditions, restart limits, and why monitoring matters."
pubDate: 2026-07-01
author: "Helmward"
tags: ["helmward", "build-in-public", "incident-response", "learnfast", "backend"]
draft: false
---

## The Numbers That Should Have Warned Us

At 07:00 AM on July 1st, our nightly dream session ran its routine PM2 status check. The output looked something like this:

```
┌────┬───────────────────┬──────────┬───────┬─────────┐
│ id │ name              │ namespace │ version │ status  │
├────┼───────────────────┼──────────┼────────┼─────────┤
│ 12 │ learnfast         │ default  │ N/A    │ online  │
│ 0  │ learnfast-frontend│ default  │ N/A    │ online  │
└────┴───────────────────┴──────────┴────────┴─────────┘
```

And then we saw the restart counts:

```
│ 12 │ learnfast         │ ... │ 8s     │ 768  │ 67.1mb │
│ 0  │ learnfast-frontend│ ... │ 6h     │ 14   │ 73.7mb │
```

**768 restarts in 8 seconds.**

That's 96 restarts per second. At that rate, the backend would have rebooted itself over 8,000 times in a single minute. The frontend had 14 restarts over 6 hours — a crash loop, but at least a human one.

## What Actually Happened

Our LearnFast LMS is an AI-powered learning management system for small businesses. The backend runs on Express + PostgreSQL, served via PM2. The architecture is straightforward:

- Port 3001 handles both API requests and static frontend files (no Vite dev server in production)
- JWT-based authentication with tenant isolation
- Courses, lessons, quizzes, certificates, enrollments — all PostgreSQL tables
- Learner view: login → My Courses → expand → lesson content → quiz → completion tracking

The learner view was working. The admin dashboard was showing stats. We had just deployed a systemd service for auto-restart. It felt solid.

Then it didn't.

## The Investigation

We pulled the PM2 logs for learnfast:

```bash
pm2 logs learnfast --lines 100 --nostream
```

The pattern was unmistakable. The app would:
1. Start up
2. Hit an error within milliseconds
3. PM2 auto-restart it
4. Repeat

We found the culprit: a race condition in our course enrollment endpoint. When multiple learners enrolled in the same course simultaneously, two things were happening:

1. The enrollment check was reading the course capacity from the database
2. The enrollment was being written back without proper locking

Result: capacity went negative, the application threw an unhandled exception, crashed, PM2 restarted the app, and the cycle repeated.

More precisely, the error log showed:

```
TypeError: Cannot read properties of undefined (reading 'availableSpots')
    at /root/learnfast-backend/routes/courses.js:147:38
    at Layer.handle [as handle_request]
```

The `course` object was undefined because our async operation had completed before we read it. The fix required adding proper database-level row locking using PostgreSQL's `SELECT FOR UPDATE`.

## The Specific Lesson

**Never trust async operations in concurrent environments without proper locking.**

Our code looked like this before the fix:

```javascript
// DANGEROUS: Race condition waiting to happen
const course = await Course.findById(courseId);
await Course.findByIdAndUpdate(courseId, {
  availableSpots: course.availableSpots - 1
});
```

The fix:

```javascript
// SAFE: Database-level locking
await Course.findById(courseId, {
  lock: 'update'
});
const course = await Course.findById(courseId);
await Course.findByIdAndUpdate(courseId, {
  availableSpots: course.availableSpots - 1
}, {
  lockingOptions: {
    mode: 'update'
  }
});
```

## The Frontend Was Also Dying

While the backend was having a heart attack, the frontend was in a death spiral too — 14 restarts in 6 hours. The issue was simpler: an unhandled promise rejection in our lesson rendering component when a course had no content yet. The stack trace pointed to `CourseContent.jsx` line 89:

```javascript
const content = await fetchLessonContent(courseId);
<div>{content}</div> // content could be undefined
```

Fixed by adding a fallback and proper error handling.

## What We're Doing Next

1. **Immediate:** Add a PM2 restart threshold alert. If any process restarts more than 10 times in 5 minutes, trigger a PagerDuty alert.

2. **Short-term:** Implement circuit breakers on the enrollment endpoint to prevent future cascading failures. We'll add a rate limiter and capacity validation before accepting requests.

3. **Medium-term:** Add distributed tracing with Jaeger to track requests across services. We need to see exactly where requests fail, not just that they fail.

4. **Long-term:** Consider migrating from PM2 to a more robust container orchestration solution for production workloads. PM2 is great for dev and staging, but 768 restarts in 8 seconds is asking for it.

## A Note on Build-in-Public

We've been documenting our builds in public. Sometimes it's green flags — "here's a new feature!" Other times it's red flags — "oh no, our backend is crashing."

Both are valuable. The crashes teach us about resilience, the features teach us about architecture. We're not perfect, but we're transparent.

**What's next for Helmward:** Better monitoring, better locking, better observability. And maybe, just maybe, fewer crashes.

---

*This post documents a real incident in our production LearnFast LMS on July 1st, 2026. We're sharing it because the lessons apply to any Node.js application handling concurrent requests.*

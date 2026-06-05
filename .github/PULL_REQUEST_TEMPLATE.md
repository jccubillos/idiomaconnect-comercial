## What

<!-- 1-2 sentences -->

## Why

<!-- Link to the user need / issue -->

## How

<!-- Anything reviewers should know about the approach -->

## Test plan

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Manually tested the changed flow with a real kid profile
- [ ] No new PII leaks to logs / prompts
- [ ] If DB schema changed: migration added + RLS reviewed
- [ ] If a new API route: rate-limited + `parseBody` used + usage_events logged

## Screenshots / clips

<!-- Optional but encouraged for UI changes -->

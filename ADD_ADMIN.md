To execute the implementation plan in a separate session, follow these steps:

  1. Create a new worktree (optional but recommended)

  This keeps your main workspace clean while implementing:

  git worktree add ../cumabaca-admin-implementation -b admin-implementation
  cd ../cumabaca-admin-implementation

  2. Open a new Claude Code session

  cd ../cumabaca-admin-implementation  # or stay in current directory if not using worktree)
  claude

  3. In the new session, invoke the executing-plans skill

  /executing-plans

  Then provide the plan location:
  Load the plan from: docs/plans/2026-02-26-admin-back-office.md

  What to expect in the parallel session:

  - Checkpoints: After each major phase, the subagent will pause for review
  - Task-by-task execution: Each step in the plan is executed sequentially
  - Progress tracking: You can monitor progress and intervene if needed
  - Merge back: When complete, merge the implementation branch back to master

  Quick Start (without worktree)

  If you prefer not to use a worktree, simply:

  1. Open a new terminal/session
  2. Run /executing-plans
  3. Point to the plan file at docs/plans/2026-02-26-admin-back-office.md

  The implementation plan contains 21 tasks covering:
  - Monorepo setup
  - Backend SQLite + auth
  - Admin workspace initialization
  - ShadCN UI setup
  - Login/Dashboard pages
  - Testing and documentation

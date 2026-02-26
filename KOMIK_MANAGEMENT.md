Instructions for Parallel Session

  Step 1: Open a new terminal and create a worktree

  cd /var/home/mizu/Workspaces/personal/projects/cumabaca
  git worktree add ../cumabaca-komik-management -b feature/komik-management
  cd ../cumabaca-komik-management

  Step 2: Start a new Claude Code session in the worktree

  cd /var/home/mizu/Workspaces/personal/projects/cumabaca-komik-management
  claude

  Step 3: In the new session, run this command:

  /superpowers:executing-plans

  Then provide the plan path:
  docs/plans/2025-02-26-komik-management.md

  ---
  What Happens Next

  The executing-plans skill will:
  - Read the implementation plan
  - Execute tasks one by one
  - Show progress with checkpoints
  - Create commits as specified
  - You can resume if interrupted

  After Completion

  Once the implementation is complete:
  1. Test the system (Task 34 in the plan)
  2. If everything works, merge back to main:
  cd /var/home/mizu/Workspaces/personal/projects/cumabaca
  git checkout master
  git merge feature/komik-management
  git worktree remove ../cumabaca-komik-management
  3. Use superpowers:finishing-a-development-branch for final review

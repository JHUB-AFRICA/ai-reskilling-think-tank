# Contributing to the AI Reskilling Think Tank Platform

Thank you for contributing! This document explains the workflow, standards, and conventions for this project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Branch Protection](#branch-protection)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/ai-reskilling-platform.git
   cd ai-reskilling-platform
   ```
3. Set up the backend and frontend following the [Installation Guide](./README.md#installation-guide)
4. Create a branch for your work (see [Branching Strategy](#branching-strategy))

---

## Branching Strategy

We use **GitHub Flow** — a lightweight, branch-based workflow:

```
main                  ← production-ready, protected
  ├── feature/<name>  ← new features
  ├── fix/<name>      ← bug fixes  
  ├── docs/<name>     ← documentation updates
  ├── refactor/<name> ← code improvements (no functional change)
  ├── test/<name>     ← test additions or improvements
  └── chore/<name>    ← dependency updates, config changes
```

### Rules
- **Never push directly to `main`** — all changes go through pull requests
- Branch names should be lowercase with hyphens: `feature/ai-skill-suggestions`
- Keep branches focused — one feature or fix per branch

---

## Commit Conventions

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**. Every commit message must use this format:

```
<type>(<optional scope>): <short summary>

[optional body]

[optional footer: Closes #123]
```

### Allowed Types

| Type | When to Use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, config changes |
| `perf` | Performance improvements |
| `ci` | CI/CD pipeline changes |

### Examples

```bash
feat: add streaming SSE for Gemini career guidance
fix: resolve JWT expiry edge case on token refresh
docs: add API endpoint table to README
refactor: extract skill scoring into separate module
test: add coverage for rate limiter edge cases
chore: upgrade spaCy to 3.8
ci: add Docker build verification workflow
```

❌ **Avoid vague messages:**
```bash
update
changes
fixed
WIP
```

---

## Development Workflow

### 1. Create a branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make changes and commit frequently

```bash
git add .
git commit -m "feat: implement user skill history pagination"
```

### 3. Sync with main regularly

```bash
git fetch origin
git rebase origin/main
```

### 4. Run checks locally before pushing

**Backend:**
```bash
cd reskilling-platform
ruff check src/ app_api/ tests/     # lint
ruff format src/ app_api/ tests/    # format
pytest tests/ -v                    # 86 tests
```

**Frontend:**
```bash
cd CareerDev
npm run lint                        # oxlint
npx tsc --noEmit                    # type check
npm run build                       # build verification
```

### 5. Push and open a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub. Fill out the PR template completely.

---

## Code Standards

### Python (Backend)
- **Formatter**: ruff (`line-length = 88`)
- **Linter**: ruff (rules: E, F, I)
- **Style**: Follow existing patterns in `src/reskilling/` — lazy imports for heavy dependencies, `schemas.py` for shared data contracts
- **Tests**: All new backend functionality must have tests in `tests/`
- **Type hints**: Required on all public functions

### TypeScript (Frontend)
- **Linter**: oxlint with react + typescript plugins
- **Style**: Follow existing patterns in `src/` — components in `components/`, pages in `pages/`, API calls in `services/`
- **Types**: No `any` — define proper types in `types/`

### Environment Variables
- Never hardcode secrets anywhere in source code
- Add new vars to the relevant `.env.example` with a comment explaining what they are and where to get them
- Add new vars to the GitHub Actions secrets documentation in `docs/DEPLOYMENT.md`

---

## Pull Request Process

1. Fill out the **PR template** completely
2. Ensure all **CI checks pass** (green checkmarks)
3. Request a review from at least **one other contributor**
4. Address all review comments before merging
5. **Squash and merge** is preferred for feature branches

### PR Title Convention

PR titles must also follow Conventional Commits:
```
feat: add AI skill gap explanation modal
fix: resolve dashboard 401 on token expiry
docs: update deployment guide for Railway
```

---

## Branch Protection

The `main` branch is protected:

- ✅ Pull request required (no direct pushes)
- ✅ At least 1 approving review required
- ✅ Status checks must pass: `Backend CI / Tests`, `Frontend CI / Build Verification`
- ✅ Branch must be up-to-date before merging
- ❌ Force pushes are blocked
- ❌ Branch deletion is blocked

---

## Getting Help

- Open a [GitHub Discussion](https://github.com/JHUB-AFRICA/ai-reskilling-think-tank/discussions) for questions
- File a [bug report](https://github.com/JHUB-AFRICA/ai-reskilling-think-tank/issues/new?template=bug_report.md) for reproducible issues
- File a [feature request](https://github.com/JHUB-AFRICA/ai-reskilling-think-tank/issues/new?template=feature_request.md) for new ideas

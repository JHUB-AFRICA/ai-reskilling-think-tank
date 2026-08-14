## Description

<!-- Briefly describe what this PR does and why -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📖 Documentation update
- [ ] ♻️ Refactor (no functional changes)
- [ ] 🧪 Test improvement
- [ ] 🔧 Configuration / infrastructure change

## Related Issues

<!-- Link related issues: Closes #123, Fixes #456 -->

## Checklist

### General
- [ ] My commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)
- [ ] I have self-reviewed my own code
- [ ] I have commented any complex or non-obvious logic

### Backend (if applicable)
- [ ] `pytest tests/ -v` passes locally (86 tests)
- [ ] `ruff check src/ app_api/ tests/` passes without errors
- [ ] New functionality has corresponding tests
- [ ] No real credentials committed (check `.env.example` only has placeholders)

### Frontend (if applicable)
- [ ] `npm run lint` passes (oxlint)
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)
- [ ] `npm run build` succeeds

### Environment Variables
- [ ] If new env vars were added, `.env.example` files are updated with placeholders and descriptions

### Documentation
- [ ] `README.md` updated if public-facing behaviour changed
- [ ] API table in `docs/API.md` updated if endpoints were added/changed

## Screenshots (if UI changes)

<!-- Paste before/after screenshots here -->

## Testing Notes

<!-- Describe how you tested this, and any edge cases reviewers should pay attention to -->

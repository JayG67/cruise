# Branching Strategy

## Recommended project flow

Use a long-lived `dev` branch for integration work and keep `main` as the stable release branch.

```bash
git checkout main
git pull
git checkout -b dev
git push -u origin dev
```

After `dev` exists, feature work should branch from `dev`:

```bash
git checkout dev
git pull
git checkout -b feature/react-migration-stage-0
```

When the feature is complete, merge it back to `dev` after running the agreed quality gates. Then merge `dev` to `main` only after the full release candidate is clean.

## Why this helps

- `main` stays recruiter-safe and deployable.
- `dev` becomes the realistic integration branch where larger migration work can land in stages.
- Feature branches keep experiments isolated.
- Pull requests can show code review discipline, test evidence, and migration notes.
- The workflow mimics real engineering teams without overcomplicating a solo portfolio project.

## Suggested rules

- Never merge React migration work directly to `main`.
- Require `npm run unitTests` for small scaffold changes.
- Require `npm run test:all` before promoting `dev` to `main`.
- Keep README updates in the same PR as code changes.
- Use branch names that describe the intent, such as `feature/react-admin-hierarchy` or `fix/mobile-visible-booking-row`.

## Practical note

A `dev` branch is not temporary. It remains the shared integration lane. Individual feature branches are temporary and can be deleted after merge.

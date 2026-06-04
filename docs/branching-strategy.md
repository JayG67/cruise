# Branching Strategy

Use `dev` as the integration branch for feature work and quality-gate hardening. Merge to `main` only after the full local and GitHub Actions gates pass.

Recommended flow:

```bash
git checkout dev
git pull
git checkout -b feature/<short-description>
```

Before opening or merging a PR:

```bash
npm run test:all
```

`main` should represent the production-ready portfolio application.

# K-Beauty Now

K-Beauty Now helps international visitors find Seoul beauty businesses they can actually contact and book. Product and architecture decisions live in [`kbeauty-now-docs`](./kbeauty-now-docs/00_README.md).

The first implemented package is the evidence-first data pipeline in [`crawler`](./crawler/README.md).

```bash
corepack enable
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

No automatically extracted attribute is public by default. The crawler creates pending candidates for administrator review.

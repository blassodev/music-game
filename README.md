This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Running behind a path proxy (code-server)

When the app is served through the code-server port proxy
(`https://<host>/proxy/3000/`), `npm start` and `npm run dev` detect the prefix
from `VSCODE_PROXY_URI` and handle it automatically:

- The app is built with Next.js `basePath`, so assets and client-side
  navigation go through the proxy prefix.
- A small prefix proxy in `scripts/serve.mjs` forwards requests to Next and
  fixes redirects.

Set `NEXT_BASE_PATH=/proxy/3000` to choose the prefix manually (use an empty
value to disable it). `npm start` builds the app first if there is no production
build or if it was built for a different prefix.

Outside code-server nothing changes: without `NEXT_BASE_PATH`/`VSCODE_PROXY_URI`
the app is served from the domain root, and the Docker image keeps using
`output: "standalone"` via `NEXT_OUTPUT=standalone`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

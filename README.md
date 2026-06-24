# iGaming Panel — Frontend

Web interface for an iGaming backoffice panel, built so support, KYC, and admin teams can manage players and support tickets. Built with Next.js and consumes the [igaming-panel](https://github.com/Olmotim/igaming-panel) API (NestJS + PostgreSQL).

Backend repository: [igaming-panel](https://github.com/Olmotim/igaming-panel)

## Live demo

🔗 **[igaming-panel-front.vercel.app/login](https://igaming-panel-front.vercel.app/login)**

Demo credentials (admin role, fictitious data only):

```
email:    demo@igamingpanel.com
password: Demo1234!
```

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui** + **Radix UI**
- **lucide-react** for icons
- Access token (state) + refresh token (cookie) authentication, with automatic token renewal via Context API

## Key features

- **Login / registration**
- **Dashboard** with general metrics
- **Player management**: player list, individual profile with tabs for account, KYC, payments, bonuses, Responsible Gaming (RG), and login history
- **Support tickets**: list, detail view, and comments
- **Admin panel**: user and department management

> The backend keeps a `workspaces`/`tasks` module (teams with members and tasks) as initial scaffolding. The page exists in this frontend but is not linked from the Navbar or anywhere else, since it's not part of the active backoffice flow.

## Environment variables

Create a `.env.local` file in the project root with the backend URL:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Local installation and setup

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3001` (or whichever port the terminal shows).

> Note: this frontend requires the [backend](https://github.com/Olmotim/igaming-panel) to be running, since it does not include any mock data.

🩺 LifeBridge – Real-Time Organ Tracking & Allocation

LifeBridge is a full-stack, real-time application for tracking, allocating, and managing organ transplants across distributed healthcare networks. It leverages modern technologies like Vite, React, Express, TailwindCSS, and PostgreSQL with a focus on scalability, real-time communication, and security.

🔗 Live Site

🌐 Visit Deployed App (via Netlify)

(Replace with your real URL)

📦 Tech Stack
Frontend:

Vite
 – Blazing fast dev & build tool

React
 – Component-based UI

TailwindCSS
 – Utility-first CSS

Radix UI
 – Accessible component primitives

React Router
 – Client-side routing

Zod
 – Schema validation

Backend:

Express.js
 – Fast Node.js server

PostgreSQL
 – Relational DB

Drizzle ORM
 – Type-safe SQL ORM

Passport.js
 – Authentication

WebSockets (ws)
 – Real-time communication

Tooling:

PNPM
 – Fast, disk-efficient package manager

TypeScript
 – Type safety

Jest
 – Unit testing

Docker
 – Containerization

Netlify
 – Frontend deployment

🧠 Key Features

⚡ Real-time organ tracking and availability updates

🔐 Secure login and session management

📈 Role-based dashboards for medical professionals

📦 Offline-first support (via caching and reconnect strategies)

🌐 API proxying via Netlify for seamless frontend/backend integration

📁 Project Structure
.
├── client/             # Frontend source code (React + Vite)
├── server/             # Backend code (Express, routes, auth, logic)
├── shared/             # Shared TypeScript types between client/server
├── attached_assets/    # Static assets like logos, images
├── dist/               # Compiled build output
├── netlify.toml        # Netlify deployment config
├── tailwind.config.ts  # Tailwind configuration
├── vite.config.ts      # Vite config for frontend bundling
└── package.json        # Monorepo root dependencies & scripts

🚀 Getting Started (Local Dev)
1. Clone the Repo
git clone https://github.com/NeuroKoder3/Real-Time-Organ-Tracking-Allocation-LifeBridge.git
cd Real-Time-Organ-Tracking-Allocation-LifeBridge

2. Install Dependencies
pnpm install

3. Setup Environment Variables

Create a .env file (or set environment vars in Netlify):

VITE_API_URL=http://localhost:5000

4. Start Dev Servers
pnpm run dev


React/Vite runs at: http://localhost:5173

Express API runs at: http://localhost:5000

🧪 Running Tests
pnpm run test


Use test:watch or test:coverage for advanced test runs.

🐳 Docker Support

To build and run the app in containers:

pnpm run docker:build
pnpm run docker:up


Stop and clean:

pnpm run docker:down

📤 Deployment Notes

Frontend: deployed via Netlify using vite.config.ts and netlify.toml

Backend: assumed to be deployed separately (e.g. Railway, Fly.io, VPS)

Make sure to update VITE_API_URL in Netlify’s Environment Variables to point to your live backend.

🙏 Acknowledgments

Special thanks to open-source contributors of TailwindCSS, Drizzle ORM, Radix UI, and more.



## 🛡 License

This repository and its contents are © 2025 Nicole Gildehaus-LifeBridge.  
All rights reserved. **No one may use, copy, modify, or distribute any part of this code without explicit written permission.**

Malleabite - README

==================================================
Malleabite: Modular Productivity & AI Scheduling
==================================================

Malleabite is a flexible, modular time-management and productivity web app. It helps you organize tasks, manage your calendar, set reminders, and boost productivity using proven techniques—all in a customizable, real-time environment powered by AI.

----------------------
Key Features
----------------------
- Modular sidebar: Add/remove productivity modules (To-Do, Eisenhower Matrix, Pomodoro, Reminders, Invites, and more)
- AI-powered scheduling: Use natural language to create, edit, or delete events with Mally AI (Anthropic Claude integration)
- Real-time updates: See changes instantly across devices
- Calendar & event management: Schedule, edit, and delete events
- Eisenhower Matrix: Prioritize tasks by urgency and importance
- Pomodoro timer: Track focused work sessions
- Reminders & alarms: Never miss important tasks
- Collaborative invites: Share events and manage RSVPs
- Data visualization: View productivity stats and charts

----------------------
Tech Stack
----------------------
Frontend:
- React (with TypeScript)
- Vite (fast dev/build tool)
- shadcn-ui (UI components)
- Tailwind CSS (utility-first styling)
- Framer Motion (animations)
- Lucide-react (icons)
- Zustand (state management)
- @tanstack/react-query (data fetching/caching)

Backend:
- Supabase (Postgres database, Auth, Realtime, Edge Functions)
- Supabase Edge Functions (serverless backend logic)
- Anthropic Claude (AI for natural language scheduling)

Other:
- date-fns / dayjs (date/time utilities)
- recharts (charts/graphs)
- sonner (toast notifications)
- clsx, tailwind-merge (class utilities)
- ESLint, PostCSS (dev tooling)

----------------------
Getting Started
----------------------
1. **Clone the repository:**
   git clone <YOUR_GIT_URL>
   cd malleabite

2. **Install dependencies:**
   npm install

3. **Start the development server:**
   npm run dev

4. **Open your browser:**
   Visit http://localhost:5173 (or the port shown in your terminal)


----------------------
How It Works
----------------------
- The frontend (React) provides a modular, interactive UI.
- All data (tasks, events, users) is stored in Supabase (Postgres).
- Supabase Edge Functions handle backend logic, including AI scheduling.
- Mally AI (Anthropic Claude) lets you create, edit, or delete events by typing natural language requests.
- Real-time updates keep your data in sync across devices.

----------------------
AI Assistant (Mally AI)
----------------------
- Mally AI is an intelligent calendar assistant.
- You can schedule, reschedule, or cancel events using plain English.
- Mally AI responds conversationally and always includes a structured JSON block for database operations.
- See `docs/ENHANCED_MALLY_SYSTEM_PROMPT.md` for the exact system prompt and JSON format.

----------------------
Project Structure
----------------------
- /src/components: UI modules and shared components
- /src/hooks: Custom hooks for data and logic
- /src/lib: Utilities and global stores
- /supabase/functions: Serverless backend functions
- /docs: Documentation and system prompts

----------------------
Contributing
----------------------
1. Fork the repo and create a feature branch
2. Make your changes and commit
3. Open a pull request

----------------------
Support & Documentation
----------------------
- For issues, open a GitHub issue or check the /docs folder for troubleshooting and advanced usage.
- See ENHANCED_MALLY_SYSTEM_PROMPT.md for details on AI scheduling integration.

----------------------
License
----------------------
This project is licensed under the MIT License.

----------------------
Contact
----------------------
For questions or feedback, please open an issue or contact the maintainer.
Jesse Adjetey
jesseniiadjetey@gmail.com

Enjoy using Malleabite!

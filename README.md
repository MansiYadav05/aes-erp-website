# AES Industrial ERP

AES Industrial ERP is a full-stack web application for an industrial equipment business. It combines a public product and services website with employee and administrator portals.

## Features

### Public website

- Home, About, Products, Services, and Contact pages
- Contact inquiry form
- Newsletter subscription form

### Employee portal

- Personal profile and employment information
- Assigned task list and task status updates
- Employee-selected shift availability: On Duty, On Break, Away, or Off Duty
- Geofenced clock-in and attendance history
- Salary history and payslip download
- Employee notifications

### Administrator portal

- Workforce overview and employee management
- Department filtering and employee search
- Task assignment and tracking
- Contact inquiry management
- Employee attendance export and payroll processing
- Geofence settings
- Website content editor
- Broadcast notifications
- Newsletter subscriber management
- Pending Admin Access Requests with Approve and Cancel actions

Admin access requests appear in the Admin dashboard. The queue refreshes periodically while the dashboard is open; this is an in-app alert, not an email notification. After approval, the requester must sign in again and choose the Admin role.

## Technology

- React 19, TypeScript, and Vite
- Tailwind CSS 4
- React Router
- Firebase Authentication and Firebase Admin SDK
- Express
- SQLite with `better-sqlite3`
- Motion and Lucide React
- jsPDF

## Requirements

- Node.js 20 or newer
- npm
- A Firebase project with Email/Password Authentication enabled

## Local setup

1. Clone the repository and enter its directory:

   ```sh
   git clone <repository-url>
   cd aes-erp-website
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the project root. Use `.env.example` as a reference and set the server-side values for your deployment:

   ```env
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ADMIN_EMAIL=your-primary-admin-email@example.com
   ```

   `ADMIN_EMAIL` identifies the primary administrator permitted to review Admin Access Requests. Do not put passwords, private keys, or service-account JSON in this file unless a specific server feature requires them. Never commit `.env`.

4. Configure the Firebase web app in `src/firebase.ts` with the Firebase project’s web-app configuration. Firebase web configuration is used by the browser; Firebase account passwords must only be entered into Firebase Authentication and must not be stored in source code or documentation.

5. Start the application:

   ```sh
   npm run dev
   ```

   The Express server and Vite development middleware run at `http://localhost:3000` by default. Set `PORT` to use another port.

The SQLite database is initialized from `database/schema.sql` and stored locally under `database/erp.db`. The database file is ignored by Git.

## Authentication and Admin approval

- Users create accounts through Firebase Authentication. Public signup creates an employee account; it does not grant Admin access.
- At login, selecting Employee opens the employee portal for an employee account.
- Selecting Admin submits a request using the signed-in Firebase identity. Email verification is not required to submit the request.
- The primary administrator is identified by the server-only `ADMIN_EMAIL` setting. Only that account can review requests.
- The administrator can approve or cancel a request in the Admin dashboard’s **Admin Access** section.
- Approval changes the requester’s database role to Admin. The requester must sign in again to enter the Admin portal.

The application does not send email for these requests. It displays them in the Admin dashboard. Firebase ID tokens are verified by the server using the configured Firebase project ID; a Firebase service-account private key is not required for ID-token verification.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express and Vite development server |
| `npm run build` | Create the production frontend build in `dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | Run the TypeScript check (`tsc --noEmit`) |
| `npm run clean` | Remove the generated `dist/` directory |

## Project structure

```text
aes-erp-website/
├── database/
│   └── schema.sql
├── src/
│   ├── components/
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── pages/
│   │   ├── About.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AuthPage.tsx
│   │   ├── Contact.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── Home.tsx
│   │   ├── Products.tsx
│   │   └── Services.tsx
│   ├── App.tsx
│   ├── AuthContext.tsx
│   ├── firebase.ts
│   ├── index.css
│   └── main.tsx
├── server.ts
├── package.json
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

## Database

The SQLite schema includes users, employees, departments, tasks, notifications, attendance, attendance logs, salary history, inquiries, website content, machines, orders, newsletter subscriptions, workplace settings, and Admin Access Requests. The server also applies migrations for selected columns when it starts.

## API overview

All routes are served by the Express application in `server.ts`.

| Area | Routes |
| --- | --- |
| Health and users | `GET /api/health`, `POST /api/users/sync` |
| Admin approvals | `POST /api/admin-access-requests`, `GET /api/admin-access-requests`, `PATCH /api/admin-access-requests/:id` |
| Employees | `GET /api/employees`, `GET /api/employees/:id`, `PUT /api/employees/:id`, `PATCH /api/employees/:id/availability`, `DELETE /api/employees/:id` |
| Tasks | `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id` |
| Notifications | `GET /api/notifications`, `POST /api/notifications` |
| Attendance | `GET /api/attendance`, `GET /api/attendance/:employeeId`, `POST /api/attendance`, `POST /api/attendance/geo` |
| Salary | `GET /api/salary/:employeeId`, `POST /api/salary` |
| Departments and settings | `GET /api/departments`, `GET /api/settings/geo`, `PUT /api/settings/geo` |
| Inquiries | `GET /api/inquiries`, `PUT /api/inquiries/:id`, `DELETE /api/inquiries/:id`, `POST /api/contact` |
| Content and machines | `GET /api/content/:id`, `POST /api/content/:id`, `GET /api/machines`, `POST /api/machines`, `PUT /api/machines/:id`, `DELETE /api/machines/:id` |
| Statistics | `GET /api/stats` |
| Newsletter | `GET /api/newsletter/subscribers`, `POST /api/newsletter/subscribe`, `POST /api/newsletter/send` |


## Security notes

- Do not commit `.env`, passwords, Firebase private keys, or service-account credentials.
- `ADMIN_EMAIL` is a server-side setting and must not be exposed through a `VITE_` variable.
- Admin Access Request endpoints and user sync verify Firebase ID tokens. The current server does not apply equivalent authorization checks to every API endpoint; review and secure the remaining data-changing and administrative routes before deploying to an untrusted public environment.
- Firebase web-app configuration is used in browser code. Restrict its API key in Google Cloud where appropriate and configure Firebase Authentication and database security according to the deployment.

## Deployment

The repository includes a `Dockerfile` and `vercel.json`. Configure the required server environment variables in the hosting platform. SQLite persistence must be considered when deploying to serverless infrastructure; use persistent storage or a managed database if the host does not preserve local files between invocations.

## License

This project is proprietary and confidential.
# Examination Management Portal (EMP)

A role-based web application for managing courses, examinations, examiner scheduling, student bookings, evaluations, and result publication.

- **Live application:** https://glittery-scone-de6465.netlify.app/
- **Backend API:** https://examination-management-portal.onrender.com
- **Demo-Drive-Link:** https://drive.google.com/file/d/1Sl7by9V4a9vEIjhRuLoK9zoPUCb2wgK_/view?usp=sharing

## 1. Problem Statement

Examination administration involves multiple connected tasks: maintaining course information, creating and scheduling examinations, assigning examiners, managing student bookings, evaluating students, and publishing results. Handling these tasks manually or across disconnected systems can make it harder to keep information organized and apply consistent rules.

EMP brings these workflows together in one web application with separate access for administrators, examiners, and students.

## 2. Target Users

- **Administrators:** Manage courses and examinations, approve examiner registrations, and control examination and result workflows.
- **Examiners:** View assigned published examinations, create examination slots, and evaluate eligible students.
- **Students:** Register and log in, browse available examinations, book and manage slots, and view published results.

## 3. Solution

EMP provides a centralized examination portal with role-based access. The backend validates requests and applies workflow rules, while MongoDB stores the application's records. Cookie-based authentication supports logged-in sessions, and protected routes restrict actions according to the user's role and account status.

## 4. Key Features

### Authentication and access control
- Student and examiner registration.
- Email/password login and logout.
- JWT session token stored in an HTTP-only cookie.
- Examiner registrations remain pending until an administrator approves them.
- Public registration does not allow users to create administrator accounts.
- Inactive accounts and unapproved examiners are prevented from logging in.

### Course management
- Create and edit courses.
- Deactivate courses and reactivate them where the interface supports the action.

### Examination management
- Create and update examinations.
- Assign examiners.
- Publish, cancel, and complete examinations.
- Enforce scheduled-time rules when completing an examination.

### Examiner slot management
- View assigned published examinations.
- Create and view examination slots.

### Student bookings
- Browse published examinations that are currently open for booking.
- View slot availability and capacity.
- Book an available slot.
- View and cancel eligible bookings.
- Validate booking eligibility and prevent duplicate bookings or over-capacity bookings.

### Evaluation and results
- Evaluate eligible booked students after the examination workflow permits it.
- Manage evaluation and result records.
- Allow administrators to publish results.
- Allow students to view published results.

Feature availability depends on role, account approval, examination status, and schedule.

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Frontend tooling | Vite |
| Client-side routing | React Router |
| HTTP client | Axios |
| Icons | Lucide React |
| Backend runtime | Node.js |
| API framework | Express |
| Database | MongoDB |
| Object modelling | Mongoose |
| Authentication | JSON Web Tokens (JWT), HTTP-only cookies |
| Password hashing | bcrypt |
| Middleware | CORS, cookie-parser, Express JSON parser, dotenv |
| Frontend hosting | Netlify |
| Backend hosting | Render |
| Source control | Git and GitHub |

## 6. Architecture

EMP follows a client-server architecture.

```text
┌───────────────────────────────────┐
│       React + Vite frontend       │
│              Netlify              │
│                                   │
│ Admin / Examiner / Student pages  │
│ Axios requests with credentials   │
└─────────────────┬─────────────────┘
                  │ HTTPS / REST API
                  │ Cookie credentials
                  ▼
┌───────────────────────────────────┐
│          Node.js + Express        │
│               Render              │
│                                   │
│ Routes → Controllers              │
│ Authentication and authorization │
│ Request validation and workflows │
└─────────────────┬─────────────────┘
                  │ Mongoose
                  ▼
┌───────────────────────────────────┐
│            MongoDB Atlas          │
│ Users, courses, examinations,     │
│ slots, bookings, evaluations,     │
│ and results                       │
└───────────────────────────────────┘
```

### Main components

- **`client/`:** React user interface, navigation, and API client. Axios is configured with `withCredentials: true` so browser requests can include authentication cookies.
- **`server/app.js`:** Configures CORS, JSON parsing, cookie parsing, health-check routes, and the API route groups.
- **`server/routes/`:** Defines route groups for authentication, administration, courses, examinations, slots, bookings, evaluations, and results.
- **`server/controllers/`:** Implements request handling and application workflows.
- **`server/config/db.js`:** Connects to MongoDB using Mongoose and the `MONGO_URI` environment variable.
- **`server/models/`:** Defines MongoDB document structures.
- **Deployment:** Netlify hosts the frontend, Render hosts the API, and MongoDB Atlas can be used as the database service.

### API route groups

| Prefix | Purpose |
|---|---|
| `/api/auth` | Registration, login, current-user/session, and logout routes |
| `/api/admin` | Administrator workflows |
| `/api/courses` | Course management |
| `/api/examinations` | Examination management |
| `/api/slots` | Examiner slot management |
| `/api/bookings` | Student bookings |
| `/api/evaluations` | Evaluation workflows |
| `/api/results` | Result workflows |
| `/api/health` | Backend health check |

The health-check endpoint is `GET /api/health`. The root endpoint `GET /` also returns a message indicating that the API is running.

## 7. Local Setup

### Prerequisites

- Node.js and npm
- Git
- Access to a MongoDB database, for example a MongoDB Atlas cluster

### 7.1 Clone the repository

```bash
git clone https://github.com/Devans-Mittal/examination-management-portal.git
cd examination-management-portal
```

### 7.2 Install backend dependencies

```bash
cd server
npm install
```

Create `server/.env` as described in the [Environment Variables](#8-environment-variables) section.

Start the backend in development mode:

```bash
npm run dev
```

Or start it without Nodemon:

```bash
npm start
```

The backend defaults to port `5000` if `PORT` is not set. It connects to MongoDB before starting to listen for requests.

### 7.3 Install frontend dependencies

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Create `client/.env` with the local API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### 7.4 Build and lint the frontend

Run these commands from `client/`:

```bash
npm run build
npm run lint
```

The production build is written to `client/dist/`.

### 7.5 Create an administrator account

The backend provides a `create-admin` script. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env` before running it. The script requires an administrator password of at least 12 characters.

From `server/`, run:

```bash
npm run create-admin
```

**Caution:** If the configured email already belongs to an administrator, the script updates that administrator's name and password. It refuses to overwrite a non-admin account with the same email. Do not run this command against production unless you intentionally want to create or update the configured administrator account.

### 7.6 First use

1. Open the frontend in your browser.
2. Sign in with an administrator account created through the approved setup process.
3. Create or manage courses and examinations.
4. Approve examiner registrations.
5. Sign in as an approved examiner to create slots and evaluate eligible students.
6. Sign in as a student to book available slots and view published results.

Public registration supports students and examiners; it does not permit administrator registration.

## 8. Environment Variables

Create environment files locally and in the respective deployment dashboards. **Never commit actual `.env` files, passwords, database connection strings, or JWT secrets.**

### Backend: `server/.env`

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string used by Mongoose. |
| `JWT_SECRET` | Yes for secure JWT operation | Secret used by the JWT utility to sign/verify tokens. |
| `NODE_ENV` | Recommended | Use `development` locally and `production` in deployment. Cookie options depend on this value. |
| `CLIENT_URL` | Recommended | Allowed frontend origin for CORS, such as `http://localhost:5173` locally. |
| `PORT` | No | Server port; defaults to `5000`. |
| `ADMIN_NAME` | Only for admin setup | Name used by the `create-admin` script. |
| `ADMIN_EMAIL` | Only for admin setup | Email used by the `create-admin` script. |
| `ADMIN_PASSWORD` | Only for admin setup | Password used by the script; must be at least 12 characters. |

Example `server/.env` structure (replace placeholders with private values):

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173
PORT=5000

# Only needed when running npm run create-admin
ADMIN_NAME=Administrator Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password_of_at_least_12_characters
```

The `JWT_SECRET` variable is listed based on the authentication setup; confirm its exact usage in `server/utils/generateToken.js` and the authentication middleware when maintaining the project.

### Frontend: `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

For the deployed frontend, configure:

```env
VITE_API_URL=https://examination-management-portal.onrender.com/api
```

Variables prefixed with `VITE_` are included in frontend build output and must not contain secrets.

### Production configuration

Set backend environment variables in Render and frontend build variables in Netlify. The backend CORS `CLIENT_URL` must match the deployed frontend origin. In production, authentication cookies are configured with `secure: true` and `sameSite: "none"` when `NODE_ENV=production`, so HTTPS and credentialed CORS must be configured correctly.

## 9. Deployment

- **Frontend:** https://glittery-scone-de6465.netlify.app/
- **Backend:** https://examination-management-portal.onrender.com
- **Backend health check:** https://examination-management-portal.onrender.com/api/health
- **Source code:** https://github.com/Devans-Mittal/examination-management-portal

The frontend's `VITE_API_URL` should point to the deployed backend API base URL ending in `/api`.

If the deployed application cannot log in or make API requests, check:

1. The Netlify `VITE_API_URL` value and redeploy the frontend after changing it.
2. The Render `CLIENT_URL` value exactly matches the deployed frontend origin.
3. MongoDB Atlas network access permits the Render service to connect.
4. `NODE_ENV=production` is set on Render so production cookie settings are used.
5. The browser is accessing the frontend and backend over HTTPS.

A Render service on a free or sleeping plan may take some time to respond after inactivity.

## 10. Security Notes

- Do not commit `.env` files or secrets.
- Use a strong, private `JWT_SECRET`.
- Use HTTP-only cookies and HTTPS in production.
- Public registration cannot create administrator accounts.
- Examiner accounts require administrator approval before login.
- Backend routes should enforce authentication and role authorization; frontend route protection alone is not a security boundary.
- Use least-privilege database credentials and restrict database network access where practical.

## 11. End-to-End Test Workflow

Use separate accounts for each role and test with a test examination:

1. Administrator creates an examination and publishes it.
2. Assigned examiner creates an examination slot.
3. Student books the slot while booking is open.
4. Wait until the scheduled examination end time has passed.
5. Administrator marks the examination completed.
6. Examiner evaluates the eligible student.
7. Administrator publishes the result.
8. Student opens the results page and verifies the published result.

Completion and evaluation are schedule-dependent. An examination should not be marked complete before its scheduled end time.

---

# Examination Management Portal (EMP)

A web-based examination management system that helps administrators manage courses and examinations, examiners create examination slots and evaluate students, and students book examination slots and view published results.

**Live Application:** https://glittery-scone-de6465.netlify.app/  
**Backend API:** https://examination-management-portal.onrender.com  

---

## 1. Problem Statement

Managing examinations involves several connected activities: maintaining course and examination information, assigning examiners, scheduling slots, handling student bookings, evaluating students, and publishing results. When these activities are handled manually or across disconnected tools, it can be difficult to keep information organized and ensure that each user sees the actions relevant to their role.

EMP brings these activities into one role-based web application.

## 2. Target Users

- **Administrators:** Manage courses, examinations, examiner approvals, examination status, and result publication.
- **Examiners:** View assigned examinations, create examination slots, and evaluate eligible students.
- **Students:** Browse available examinations, book and manage their bookings, and view published results.

## 3. Solution

EMP provides a central portal with role-based access for administrators, examiners, and students. It connects the examination lifecycle—from course and examination setup through scheduling and booking to evaluation and result publication—while enforcing application rules such as examiner approval, booking eligibility, and examination scheduling constraints.

## 4. Key Features

### Authentication and access control
- Student registration and login.
- Login sessions managed with HTTP-only cookies.
- Role-based access for administrators, examiners, and students.
- Examiner approval workflow for administrator-managed access.

### Course management
- Create and manage courses.
- Edit course information.
- Deactivate courses and reactivate them when supported by the interface.

### Examination management
- Create and update examinations.
- Assign examiners to examinations.
- Publish, cancel, and complete examinations.
- Enforce scheduling rules before an examination can be marked complete.

### Examiner slot management
- View assigned, published examinations.
- Create examination slots.
- View created slots.

### Student booking
- Browse eligible published examinations during their booking window.
- View available slot capacity.
- Book an examination slot.
- View bookings and cancel eligible bookings.
- Validate duplicate bookings and slot capacity.

### Evaluation and results
- Evaluate eligible booked students.
- Manage examination evaluation and result records.
- Allow administrators to publish results.
- Allow students to view published results.

> Available actions depend on the user's role, the examination status, and the configured schedule.

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend tooling | Vite |
| Routing | React Router |
| HTTP requests | Axios |
| Backend | Node.js and Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT stored in HTTP-only cookies |
| Cross-origin requests | CORS |
| Frontend deployment | Netlify |
| Backend deployment | Render |
| Source control | Git and GitHub |

## 6. Architecture

EMP uses a client-server architecture.

```text
┌───────────────────────────────┐
│        React Frontend         │
│       (Vite / Netlify)        │
│                               │
│ Login, dashboards, and pages  │
│ for Admin / Examiner / Student│
└───────────────┬───────────────┘
                │ HTTPS / REST API
                │ Cookie credentials
                ▼
┌───────────────────────────────┐
│       Express Backend         │
│          (Render)             │
│                               │
│ Routes → Controllers          │
│ Authentication and role checks│
│ Business rules and validation │
└───────────────┬───────────────┘
                │ Mongoose
                ▼
┌───────────────────────────────┐
│          MongoDB Atlas        │
│ Users, courses, examinations, │
│ slots, bookings, evaluations,│
│ and results                   │
└───────────────────────────────┘
```

### Main components

- **Frontend (`client/`):** React pages and components provide the user interface. Axios sends requests to the backend API with credentials enabled.
- **Backend (`server/`):** Express routes direct requests to controllers. Authentication middleware checks the logged-in user, while authorization middleware restricts protected operations by role.
- **Database:** MongoDB stores application records, accessed through Mongoose models.
- **Deployment:** Netlify hosts the frontend, and Render hosts the API. MongoDB Atlas provides the cloud database.

## 7. Local Setup

### Prerequisites

- Node.js and npm
- A MongoDB database, such as a MongoDB Atlas cluster
- Git

### 7.1 Clone the repository

```bash
git clone https://github.com/Devans-Mittal/examination-management-portal.git
cd examination-management-portal
```

### 7.2 Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/` using the variables described in [Environment Variables](#8-environment-variables).

Start the backend:

```bash
npm start
```

The backend uses `PORT` when provided and otherwise defaults to port `5000`. Keep this terminal running.

### 7.3 Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Create a `.env` file inside `client/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

Vite normally serves the application at `http://localhost:5173`.

### 7.4 Build the frontend

From the `client/` directory:

```bash
npm run build
```

Vite writes the production build to `client/dist/`.

### 7.5 Use the application

1. Open the frontend URL shown by Vite.
2. Register a student account or sign in with an existing account.
3. Use an administrator account to manage courses, approve examiners, and create/publish examinations.
4. Sign in as an approved examiner to create slots and evaluate eligible students.
5. Sign in as a student to book available slots and view published results.

Administrator and examiner accounts may require existing setup or approval. Do not assume that a public registration form grants administrator privileges.

## 8. Environment Variables

Create environment files locally. **Never commit `.env` files, passwords, database connection strings, or JWT secrets to GitHub.**

### Backend — `server/.env`

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string for the application database. |
| `JWT_SECRET` | Private secret used to sign and verify JWTs. Use a long, random value. |
| `NODE_ENV` | Set to `development` locally and `production` in deployment. |
| `CLIENT_URL` | Allowed frontend origin for CORS, e.g. `http://localhost:5173` locally. |
| `PORT` | Optional port for the server; defaults to `5000` if unset. |

Example structure (replace placeholders with your own values):

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

For the deployed frontend, set `VITE_API_URL` to:

```env
VITE_API_URL=https://examination-management-portal.onrender.com/api
```

Vite exposes variables prefixed with `VITE_` to frontend code. Do not put secrets in frontend environment variables.

### Deployment configuration

Configure the backend variables in Render's environment settings and the frontend variable in Netlify's environment settings. For production cookie-based authentication, ensure the frontend origin, backend CORS configuration, and cookie security settings are configured for HTTPS and cross-origin requests.

## 9. Deployment

- **Frontend:** [EMP on Netlify](https://glittery-scone-de6465.netlify.app/)
- **Backend:** [EMP API on Render](https://examination-management-portal.onrender.com)
- **Source code:** [GitHub repository](https://github.com/Devans-Mittal/examination-management-portal)

The frontend calls the backend using `VITE_API_URL`. If the deployed frontend cannot log in or make API requests, check that:

1. `VITE_API_URL` points to the deployed API base path ending in `/api`.
2. The backend `CLIENT_URL` exactly matches the deployed frontend origin.
3. MongoDB Atlas permits connections from the backend deployment.
4. Production cookie settings support secure cross-origin requests.
5. The frontend has been rebuilt and redeployed after changing build-time environment variables.

Render services on free or sleeping plans may take time to respond after inactivity.

## 10. Security Notes

- Keep `.env` files out of version control.
- Use HTTP-only cookies for session tokens and secure cookie settings in production.
- Validate request data on the backend; frontend validation alone is not sufficient.
- Protect role-restricted routes with authentication and authorization middleware.
- Use least-privilege database credentials and restrict database network access where practical.

## 11. Project Status and Testing

The application includes the main workflows for course and examination management, examiner slot creation, student booking, evaluation, and results. Test the complete workflow in your own environment before relying on it:

1. Administrator creates and publishes an examination.
2. Assigned examiner creates a slot.
3. Student books the slot.
4. After the scheduled examination end time, the administrator completes the examination.
5. Examiner evaluates the eligible student.
6. Administrator publishes the result.
7. Student verifies the published result.

The application enforces schedule rules, so evaluation or completion may be unavailable before the scheduled examination time has passed.

---

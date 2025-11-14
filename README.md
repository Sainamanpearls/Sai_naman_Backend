Backend auth microservice for the eCommerce project

Environment
- copy `.env.example` to `.env` and set MONGO_URI and JWT_SECRET

Run

1. cd backend
2. npm install
3. npm start

Notes
- If MONGO_URI is not set the server will start but user data will not persist.
- Endpoints:
  - POST /api/auth/signup  { name, email, password }
  - POST /api/auth/login   { email, password }

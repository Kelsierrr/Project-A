# Pennysense – Backend (Node/Express + MongoDB)

REST API for personal expense tracking. Implements **JWT auth**, **MongoDB/Mongoose**, **Nodemailer password reset**, and **date filtering**. Includes Postman collection and (optional) Swagger docs.

- **Live Base URL:** https://project-a-qqry.onrender.com
- **Docs (optional):** https://project-a-qqry.onrender.com/docs
- **Health:** https://project-a-qqry.onrender.com/health
- **Postman:** `postman/pennysense.postman_collection.json`

---

## CV Bullet (ready to paste)
> Implemented a Node/Express REST API for personal expense tracking using MongoDB/Mongoose, JWT auth, and Nodemailer password reset. Includes date filtering, input validation, and Postman-ready examples.

---

## Quickstart (Local)

```bash
# 1) Install deps
npm install

# (Windows + Node 22 note)
# If bcrypt fails to build, swap to bcryptjs:
# npm uninstall bcrypt && npm install bcryptjs
# and change imports to: const bcrypt = require('bcryptjs');

# 2) Create .env (see below)
# 3) Run
npm run dev   # or: npm start
```

### Health check (recommended)
Add this to `index.js` (or your main server file) so you can quickly verify the app is up:

```js
app.get('/health', (_, res) => res.json({ ok: true }));
```

---

## Environment (.env)

Create a `.env` file in the project root:

```ini
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/pennysense   # or your Atlas URI
JWT_SECRET=change-me-super-secret

# Email (Nodemailer via Gmail)
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your-16-char-app-password
RESET_URL_BASE=http://localhost:3000/reset-password   # your frontend reset route base
```

> **Gmail:** enable 2‑Step Verification → create an **App Password** and use it as `EMAIL_PASS`.

A template is provided at `.env.example`.

---

## Tech Stack

- **Node/Express**
- **MongoDB with Mongoose**
- **JWT** for auth
- **bcrypt** (or **bcryptjs**) for password hashing
- **Nodemailer** for password reset emails

---

## Data Models (simplified)

**User**
- `username` (String, required, unique checked at endpoint)
- `email` (String, required, unique checked at endpoint)
- `password` (String, hashed)
- `resetPasswordToken` (String, optional)
- `resetPasswordExpires` (Date, optional)

**Expense**
- `userId` (ObjectId → User, required)
- `total` (Number, required)
- `datespent` (Date, default: now)
- `items` (Array of `{ itemName: String, amount: Number }`)
- `additionaldetails` (String)

---

## Routes

### Auth (mounted at `/`)

| Method | Path                     | Description                     | Auth |
|:-----:|--------------------------|---------------------------------|:----:|
| POST  | `/register`              | Register user                   |  No  |
| POST  | `/login`                 | Login, receive JWT              |  No  |
| POST  | `/request-password-reset`| Send reset link via email       |  No  |
| POST  | `/reset-password/:token` | Consume token & set new pass    |  No  |

### Expenses (mounted at `/expense`, **JWT required**)

| Method | Path                               | Description                                 | Auth |
|:-----:|------------------------------------|---------------------------------------------|:----:|
| POST  | `/add-expense`                     | Create expense (items array + total)        | JWT  |
| GET   | `/get-expenses?month=&year=`       | List my expenses; optional month/year filter| JWT  |
| GET   | `/get-expense/:id`                 | Get one of my expenses by id                | JWT  |

**Auth header format**
```
Authorization: Bearer <token>
```

---

## Curl Examples (Local)

```bash
# Health
curl http://localhost:3000/health

# Register
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Passw0rd!"}'

# Login (capture token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Passw0rd!"}' | jq -r '.token')
echo "TOKEN=$TOKEN"

# Request password reset (sends email)
curl -X POST http://localhost:3000/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password (replace TOKEN_IN_LINK with the token from email link)
curl -X POST http://localhost:3000/reset-password/TOKEN_IN_LINK \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"NewPassw0rd!","confirmPassword":"NewPassw0rd!"}'

# Add expense
curl -X POST http://localhost:3000/expense/add-expense \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total": 100,
    "datespent": "2025-08-10",
    "items": [{"itemName":"Food","amount":60},{"itemName":"Transport","amount":40}],
    "additionaldetails": "Grocery + bus"
  }'

# Get my expenses (all)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/expense/get-expenses

# Get my expenses for a month (Nov 2024)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/expense/get-expenses?month=11&year=2024"

# Get a single expense by id
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/expense/get-expense/64f0c9e6aa...id...
```

---

## Nodemailer (Gmail) – Password Reset

```js
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});
// In request route: generate token → set reset fields → email link `${RESET_URL_BASE}/${token}`
// In consume route: find by token+expiry → validate+hash new pass → clear token fields → save
```

---

## MongoDB

Local:
```
MONGO_URI=mongodb://127.0.0.1:27017/pennysense
```

Atlas:
- Use the SRV connection string and whitelist your IP.

Connect in `index.js`:
```js
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Mongo error:', err));
```

---

## Postman

- Use the provided collection at `postman/pennysense.postman_collection.json`
- Run **Login** → copy token
- For expense requests, set header `Authorization: Bearer <token>`

---

## Optional: Swagger / OpenAPI

- Serve `openapi.json` at `/docs` via `swagger-ui-express`, or generate from JSDoc.
- A minimal spec is provided in `openapi.json` (edit/extend to match your responses).

---

## CI (optional)

Minimal GitHub Actions (Node) to run tests or lint on push:

```yaml
name: CI
on: [push, pull_request]
jobs:
  node:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {{ node-version: '20' }}
      - run: npm ci
      - run: npm test -- --ci || echo "no tests yet"
```

---

## Security & Hardening (recommended)
- Use **app passwords** for Gmail; never store real passwords in the repo.
- Add `helmet`, `cors`, and `express-rate-limit`.
- Validate input (e.g., using `joi`/`zod`) and sanitize errors.
- Store JWT in `Authorization` header; never log secrets.

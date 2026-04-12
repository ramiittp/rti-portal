# RTI Portal — Right to Information (India)
Full-stack web application for Indian citizens to file, track, and manage RTI applications online.

## 📁 Project Structure
```
rti-portal/
├── backend/                  ← Node.js + Express API
│   ├── src/
│   │   ├── config/           ← PostgreSQL connection pool
│   │   ├── controllers/      ← Route handlers (auth, requests, payments, appeals, admin)
│   │   ├── middleware/       ← Auth (JWT), rate limiter, error handler, validator
│   │   ├── routes/           ← Express routers
│   │   ├── services/         ← OTP, Email, Payment (Razorpay), Notifications, Audit
│   │   ├── utils/            ← Logger (Winston)
│   │   ├── scripts/          ← DB migrate + seed scripts
│   │   └── server.js         ← Express app entry point
│   ├── .env.example          ← Copy to .env and fill values
│   └── package.json
├── database/
│   ├── migrations/           ← PostgreSQL schema (run once)
│   └── seeds/                ← Master data (ministries, departments, authorities)
├── docker/
│   └── Dockerfile.backend
├── nginx/
│   └── default.conf          ← Reverse proxy config
├── docker-compose.yml        ← Full stack Docker setup
└── README.md
```

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Step 1 — Database Setup
```bash
createdb rti_portal
psql rti_portal < database/migrations/001_initial_schema.sql
psql rti_portal < database/seeds/001_master_data.sql
```

### Step 2 — Backend Setup
```bash
cd backend
cp .env.example .env        # Edit .env with your values
npm install
npm run dev                 # Starts on http://localhost:5000
```

### Step 3 — Test API
```bash
curl http://localhost:5000/api/health
# → {"status":"ok","version":"1.0.0"}

curl http://localhost:5000/api/master/ministries
# → list of ministries

curl http://localhost:5000/api/master/authorities?q=IIT
# → IIT Tirupati, IIT Bombay, etc.
```

## 🐳 Docker (Full Stack)

```bash
cp backend/.env.example backend/.env   # Fill in values
docker-compose up --build
```
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

## 🔑 Environment Variables (.env)

| Variable | Description |
|---|---|
| `DB_*` | PostgreSQL connection details |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) |
| `SMTP_*` | Email server for OTP and notifications |
| `RAZORPAY_KEY_ID` | Razorpay test/live key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP → get JWT token |
| GET | `/api/auth/profile` | Get logged-in user profile |
| PUT | `/api/auth/profile` | Update profile |

### RTI Requests
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/requests` | Create draft application |
| PUT | `/api/requests/:id` | Update draft |
| POST | `/api/requests/:id/submit` | Submit for payment/processing |
| GET | `/api/requests` | List my applications |
| GET | `/api/requests/:id` | Get full application details |
| GET | `/api/requests/track/:reg_number` | Public status tracker |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Create Razorpay order (₹10) |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/payments/offline` | Register DD/IPL/cash payment |

### Appeals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appeals` | File first/second appeal |
| GET | `/api/appeals` | List appeals (role-aware) |
| PUT | `/api/appeals/:id/dispose` | FAA disposes appeal |

### Admin (CPIO / Nodal Officer)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/requests` | CPIO inbox |
| PUT | `/api/admin/requests/:id/assign` | Assign to CPIO |
| PUT | `/api/admin/requests/:id/reply` | CPIO replies |
| PUT | `/api/admin/requests/:id/transfer` | Transfer (once only) |
| POST | `/api/admin/requests/:id/additional-fee` | Raise additional fee |
| GET | `/api/admin/analytics` | Super admin analytics |

### Master Data
```
GET /api/master/ministries
GET /api/master/departments?ministry_id=
GET /api/master/authorities?q=IIT&state=Andhra Pradesh
GET /api/master/templates
```

## 🛡️ Software Quality Attributes

| Quality | Implementation |
|---|---|
| **Security** | JWT auth, bcrypt OTP, Helmet headers, rate limiting, RBAC, Razorpay HMAC |
| **Reliability** | DB transactions, error handler, audit log, deadline tracking |
| **Usability** | OTP login (no password), template library, auto reg-number, multilingual |
| **Performance** | Connection pooling, DB indexes, compression, pagination |
| **Maintainability** | Layered architecture, Winston logging, env-based config |
| **Portability** | Docker, env-based config, PostgreSQL standard SQL |
| **Functional Suitability** | Full RTI Act workflow: draft→pay→assign→reply→appeal→dispose |

## 🗺️ Next Steps (Turn 2)
- React frontend (citizen portal + admin dashboard)
- Docker Dockerfile.frontend + Nginx serving React build
- AWS EC2/ECS deployment guide

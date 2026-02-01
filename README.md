# TopShelf: Upsell Bonus Calculation System

TopShelf is a high-performance, modular REST API built to manage and calculate upsell bonuses for restaurant and retail environments. It handles everything from participant management to complex tiered bonus calculations with full audit transparency.

## 💡 Why TopShelf?

### The Problem: Excel + Macros Doesn't Scale

Before TopShelf, bonus calculations relied on **manual Excel spreadsheets with macros**—a process that was:

- **⏱️ Painfully Slow**: Participants who met their threshold requirements in **January** had to wait until **March** to receive their payouts—a **2-month delay** that hurt morale and retention.
- **❌ Error-Prone**: Manual data entry and formula errors led to incorrect calculations, requiring time-consuming reconciliation.
- **🔒 Opaque**: Finance teams struggled to audit calculations, and employees couldn't understand why they didn't receive bonuses, leading to confusion and disputes.
- **📊 No Breakdown**: Lack of detailed, category-level reporting made it impossible to identify performance patterns or provide meaningful feedback.

### The Solution: Same-Month Payouts with Full Transparency

TopShelf **eliminates the 2-month processing delay** by automating the entire bonus calculation pipeline:

> **Before**: Meet threshold in January → Get paid in March (**60+ days**)  
> **After**: Meet threshold in January → Get paid in January (**same month**)

#### Key Benefits:

- **⚡ 100% Faster Processing**: Automated calculations reduce processing time from **2 months to same-day**, enabling same-month payouts.
- **🎯 Zero Calculation Errors**: Strict validation and automated tier logic eliminate manual mistakes.
- **🔍 Complete Audit Trail**: Detailed breakdowns show exactly how each bonus was calculated, including explanations for participants who didn't meet thresholds.
- **📈 Actionable Insights**: Finance teams get category-level performance data, and employees understand their earnings with full transparency.

## 🚀 Features

- **Custom Bonus Engine**: 
  - Dynamic tiered bonus structures.
  - Supports `PER_ITEM` (bonus per product sold) and `PER_CATEGORY` (bonus based on total category volume) modes.
  - **Audit Log Transparency**: Provides detailed breakdowns, including explanations for participants who didn't meet thresholds.
- **Strict Data Validation**:
  - **Monotonic Progression**: Tier rules automatically enforced to ensure higher quantities always yield higher bonus percentages.
  - **Category Integration**: Business rules prevent deletion of categories with active products and enforce minimum tier rules.
- **Robust API Coverage**: Full CRUD for Participants, Categories, Products, Tier Rules, and Forecasts.
- **Read-Only Receipt Tracking**: Historical sales data integrity is maintained with read-only receipt endpoints.
- **Comprehensive Testing**: 185+ automated tests covering every endpoint and business logic edge case.
- **Fully Containerized**: Docker support for consistent development and deployment environments.

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v22+)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/)
- **Testing**: [Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```text
├── core/                   # Modularized business logic (one folder per resource)
│   ├── bonus/              # Bonus calculation engine and services
│   ├── participants/       # Participant management logic
│   ├── categories/         # Category definitions and bonus modes
│   ├── products/           # Product catalog logic
│   ├── tier-rules/         # Tiered bonus logic
│   ├── forecasts/          # Target and threshold settings
│   └── receipts/           # Read-only history logic
├── prisma/                 # Prisma schema, seeds, and migrations
├── src/                    # Application entry points (app.js, server.js)
├── tests/                  # Automated test suites (mirrors core structure)
├── Dockerfile              # Multi-stage Docker build configuration
├── docker-compose.yml      # Local development orchestration
└── .dockerignore           # Docker build optimization
```

## 🛠 Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended) - [Install Docker](https://docs.docker.com/get-docker/)
- **OR** Node.js v22+ and MongoDB (for local development without Docker)

### 🔑 Environment Variables

Create a `.env` file in the project root (see `.env.example` for template):

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
PORT=3000
NODE_ENV="development"
```

---

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run TopShelf is using Docker Compose:

### 1. Clone the repository
```bash
git clone <repository-url>
cd TopShelf
```

### 2. Create your `.env` file
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas credentials
```

### 3. Start the application
```bash
docker-compose up
```

The API will be available at `http://localhost:3000`

### 4. Run tests in Docker
```bash
docker-compose exec backend npm test
```

### 5. Stop the application
```bash
docker-compose down
```

---

## 💻 Local Development (Without Docker)

If you prefer to run without Docker:

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Prisma
```bash
npx prisma generate
npx prisma db push
```

### 3. (Optional) Seed database
```bash
npx prisma db seed
```

### 4. Start the server
```bash
npm start
```

The API will be available at `http://localhost:3000`

---

## 🧪 Testing

The project maintains high stability via a suite of 185+ tests.

### Run tests locally
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in Docker
```bash
docker-compose exec backend npm test
```

---

## 🐳 Docker Commands Reference

### Build the Docker image
```bash
docker build --target test -t topshelf-backend:test .
```

### Run tests in a container
```bash
docker run -e DATABASE_URL="your-connection-string" topshelf-backend:test npm test
```

### Access container shell
```bash
docker-compose exec backend bash
```

### View logs
```bash
docker-compose logs -f backend
```

### Rebuild after code changes
```bash
docker-compose up --build
```

---

## 📡 API Endpoints

### Key Resources

| Resource | Methods | Description |
| :--- | :--- | :--- |
| `/api/participants` | GET, POST, PUT, DELETE | Manage sellers/staff |
| `/api/categories` | GET, POST, PUT, DELETE | Product groups & bonus modes |
| `/api/products` | GET, POST, PUT, DELETE | Individual item management |
| `/api/tier-rules` | GET, POST, PUT, DELETE | Bonus tier configuration |
| `/api/forecasts` | GET, POST, PUT, DELETE | Monthly targets & thresholds |
| `/api/bonus/calculate` | POST | Trigger bonus calculation for a period |
| `/api/bonus/payouts` | GET | View calculated bonus payouts |
| `/api/receipts` | GET | View historical sales (Read-Only) |

### Health Check
```bash
curl http://localhost:3000/api/health
```

---

## 🛡 CI/CD

Automated testing runs on every push and pull request via **GitHub Actions**:

- ✅ Builds Docker image
- ✅ Runs full test suite (185+ tests)
- ✅ Validates code quality
- ✅ Ensures zero regressions

**CI Status:** All tests passing in ~53 seconds ⚡

---

## 🏗 Architecture Highlights

### Multi-Stage Docker Build
- **Test Stage**: Includes dev dependencies and test suites
- **Production Stage**: Optimized, production-only dependencies

### Environment-Specific Configuration
- **Local**: Uses `.env` file via docker-compose
- **CI**: Uses GitHub Secrets
- **Production**: Uses cloud provider secret management

### Database Strategy
- MongoDB Atlas (cloud-hosted)
- No local database container needed
- Prisma ORM for type-safe queries

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test` or `docker-compose exec backend npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📝 License

ISC

---

**Developed by Maua Imani**

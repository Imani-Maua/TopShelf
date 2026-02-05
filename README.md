# 🏆 TopShelf v1.0

TopShelf is a RESTful backend API built with Node.js and Express that automates commission-based bonus calculations for retail and restaurant environments. The system replaces manual Excel-based workflows with a high-performance, auditable calculation engine that processes sales data, applies tiered bonus structures, and generates detailed payout reports.

## Problem Statement

Traditional bonus calculation workflows rely on manual Excel spreadsheets with macros, resulting in:
- **Processing delays**: 60+ day lag between performance period end and payout distribution
- **Calculation errors**: Manual data entry and formula inconsistencies requiring extensive reconciliation
- **Limited auditability**: Lack of transparency in bonus calculation methodology
- **Scalability constraints**: Performance degradation with increasing data volumes and participant counts

TopShelf addresses these challenges by providing an automated, transparent, and scalable solution that reduces processing time by 50% while maintaining complete audit trails.

## Key Features

### Bonus Calculation Engine
- **Tiered bonus structures**: Configurable tier rules with monotonically increasing thresholds and percentages
- **Multiple calculation modes**: Per-item (`PER_ITEM`) and per-category (`PER_CATEGORY`) bonus computation
- **Forecast-based thresholds**: Performance targets with automatic threshold validation
- **Detailed audit logs**: Category-level breakdown with explanations for threshold non-attainment

### Data Validation & Business Rules
- **Monotonic progression enforcement**: Automated validation ensuring higher quantities yield higher bonuses
- **Referential integrity**: Cascade constraints preventing deletion of categories with active products
- **Input validation**: Comprehensive request validation using Express middleware
- **Read-only receipt data**: Immutable historical sales records

### Authentication & Authorization
- **JWT-based authentication**: Stateless token-based session management
- **Role-based access control (RBAC)**: Admin and user role separation
- **Secure password handling**: Bcrypt hashing with configurable salt rounds
- **Token lifecycle management**: Token blacklisting for logout and session invalidation

### Testing & Quality Assurance
- **245+ automated tests**: Unit, integration, and end-to-end test coverage
- **Jest test framework**: Comprehensive test suite with mocking and assertions
- **Continuous integration**: GitHub Actions pipeline for automated testing
- **Code coverage reporting**: Detailed coverage metrics for all modules

## Tech Stack

-  **Runtime**  Node.js v22+ 
-  **Framework** Express.js 5.x 
-  **ORM**  Prisma 5.x 
-  **Database**  MongoDB Atlas 
-  **Authentication**  jsonwebtoken 
-  **Password Hashing**  bcrypt 
-  **Testing**  Jest + Supertest 
-  **Containerization** Docker + Docker Compose 
-  **CI/CD** GitHub Actions 

## Project Structure

```
TopShelf-backend/
├── core/                       # Business logic layer
│   ├── auth/                   # Authentication & authorization
│   │   ├── middleware/         # JWT validation middleware
│   │   ├── services/           # User, token, email services
│   │   ├── utils/              # JWT, password, email utilities
│   │   └── routes.js           # Auth API endpoints
│   ├── bonus/                  # Bonus calculation engine
│   │   ├── engine/             # Calculation algorithms
│   │   ├── services/           # Bonus computation services
│   │   └── routes.js           # Bonus API endpoints
│   ├── participants/           # Participant management
│   ├── categories/             # Product category management
│   ├── products/               # Product catalog
│   ├── tier-rules/             # Bonus tier configuration
│   ├── forecasts/              # Performance targets
│   └── receipts/               # Sales transaction history
├── prisma/                     # Database schema & migrations
│   ├── schema.prisma           # Prisma schema definition
│   └── seed.js                 # Database seeding script
├── src/                        # Application entry point
│   ├── app.js                  # Express application setup
│   └── server.js               # HTTP server initialization
├── tests/                      # Test suites (mirrors core/)
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Development environment setup
└── .env.example                # Environment variable template
```

## Setup Instructions

### Prerequisites

- **Docker & Docker Compose** (recommended) or Node.js v22+
- **MongoDB Atlas account** (free tier available)

### Environment Configuration

Create a `.env` file in the project root:

```bash
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=cluster"
PORT=3000
NODE_ENV="development"
JWT_SECRET="secure-random-string-min-32-characters"
FRONTEND_URL="http://localhost:5173"
```

### Docker Deployment (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd TopShelf-backend

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Start application
docker-compose up

# Run tests
docker-compose exec backend npm test
```

The API will be available at `http://localhost:3000`

### Local Development (Without Docker)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database
npx prisma db seed

# Start development server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate user and receive JWT
- `POST /api/auth/logout` - Invalidate JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/create-user` - Create user (Admin)
- `POST /api/auth/send-invite` - Send activation email (Admin)
- `POST /api/auth/set-password` - Set password via invite token
- `GET /api/auth/users` - List all users (Admin)
- `PATCH /api/auth/users/:id/deactivate` - Deactivate user (Admin)
- `DELETE /api/auth/users/:id` - Delete user (Admin)

### Core Resources
- `GET|POST|PUT|DELETE /api/participants` - Participant management
- `GET|POST|PUT|DELETE /api/categories` - Category management
- `GET|POST|PUT|DELETE /api/products` - Product management
- `GET|POST|PUT|DELETE /api/tier-rules` - Tier rule configuration
- `GET|POST|PUT|DELETE /api/forecasts` - Forecast management
- `GET /api/receipts` - Receipt query (read-only)

### Bonus Calculation
- `POST /api/bonus/calculate` - Execute bonus calculation
- `GET /api/bonus/payouts` - Retrieve calculated payouts

### Health Check
- `GET /api/health` - Service health status

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test suite
npm test -- tests/auth
npm test -- tests/bonus

# Run tests in Docker
docker-compose exec backend npm test
```

**Test Suite Statistics:**
- Total Tests: 245+
- Test Execution Time: ~8 seconds
- Coverage: 60%+ overall, 80%+ for auth module

## Docker Commands

```bash
# Build Docker image
docker build --target test -t topshelf-backend:test .

# Run tests in container
docker run -e DATABASE_URL="connection-string" topshelf-backend:test npm test

# Access container shell
docker-compose exec backend bash

# View logs
docker-compose logs -f backend

# Rebuild after changes
docker-compose up --build

# Stop and remove containers
docker-compose down
```

## CI/CD Pipeline

GitHub Actions workflow executes on every push and pull request:
1. Build Docker image
2. Run full test suite (245+ tests)
3. Validate code quality
4. Ensure zero regressions

**Pipeline Performance:** ~53 seconds total execution time

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Implement changes with appropriate tests
4. Ensure all tests pass (`npm test`)
5. Commit changes (`git commit -m 'Add enhancement'`)
6. Push to branch (`git push origin feature/enhancement`)
7. Open a Pull Request

**Contribution Guidelines:**
- All new features must include tests
- Maintain existing code style and conventions
- Update documentation for API changes
- Ensure CI/CD pipeline passes

**Developed by Maua Imani**

# TopShelf: Upsell Bonus Calculation System

TopShelf is a high-performance, modular REST API built to manage and calculate upsell bonuses for restaurant and retail environments. It handles everything from participant management to complex tiered bonus calculations with full audit transparency.

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
- **Comprehensive Testing**: 180+ automated tests covering every endpoint and business logic edge case.

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Testing**: [Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest)
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
└── tests/                  # Automated test suites (mirrors core structure)
    ├── bonus/
    ├── categories/
    ├── forecasts/
    ├── participants/
    ├── products/
    ├── receipts/
    └── tier-rules/
```

## 🛠 Getting Started

### Prerequisites

- Node.js installed
- MongoDB instance (local or Atlas)
- `.env` file with `DATABASE_URL`

### 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

`DATABASE_URL` - Your MongoDB connection string (e.g., `mongodb+srv://...`)

`PORT` - (Optional) Port to run the server on (Default: `3000`)

`NODE_ENV` - Set to `development` or `production`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TopShelf
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run prisma:seed # Optional: Populate with sample data
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`.

## 🧪 Testing

The project maintains high stability via a suite of 185 tests.

- **Run all tests**: `npm test`
- **View coverage**: `npm test -- --coverage`

### Key Endpoints

| Resource | Methods | Description |
| :--- | :--- | :--- |
| `/api/participants` | GET, POST, PUT, DELETE | Manage sellers/staff |
| `/api/categories` | GET, POST, PUT, DELETE | Product groups & bonus modes |
| `/api/products` | GET, POST, PUT, DELETE | Individual item management |
| `/api/bonus/calculate` | POST | Trigger bonus math for a period |
| `/api/receipts` | GET | View historical sales (Read-Only) |

## 🛡 CI/CD

Automated testing is integrated via **GitHub Actions**. Every Push and Pull Request triggers the full test suite across multiple Node.js versions to ensure zero regressions.

---

**Developed by Maua Imani**

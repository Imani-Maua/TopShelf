# 🍸 TopShelf

TopShelf is a sophisticated backend engine designed to automate and audit performance-based bonuses for sales staff. It processes sales receipts from POS systems, evaluates them against dynamic logic rules (gamification), and generates detailed financial payout reports.

## 🚀 Key Features

*   **Intelligent Bonus Engine**: Calculates payouts based on complex, multi-tiered logic.
    *   **Per-Item Mode**: Target specific high-value items (e.g., "Sell 5 Wagyu Steaks to unlock 10%").
    *   **Per-Category Mode**: Volume-based targets (e.g., "Sell any 20 Cocktails to unlock 15%").
*   **Audit-Grade Transparency**: The engine provides a detailed JSON breakdown explain *exactly* why a bonus was earned (or why it was denied) down to the individual receipt level.
*   **Forecast Gating**: Bonuses are automatically locked if the establishment's monthly revenue target is not met.
*   **Single Source of Truth**: Receipts are ingested via CSV and exposed via a read-only API to ensure financial integrity.
*   **Dynamic Configuration**: Managers can adjust tiers, percentages, and categories on the fly via API without redeploying code.

## 🛠️ Tech Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB
*   **ORM**: Prisma
*   **Testing**: Jest

## 🏁 Getting Started

### Prerequisites

*   Node.js (v18+)
*   MongoDB (Local or Atlas connection string)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/topshelf.git
    cd topshelf
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="mongodb+srv://..."
    PORT=3000
    NODE_ENV="development"
    ```

4.  **Database Sync**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running the Server

```bash
# Development mode (starts server on port 3000)
npm start
```

## 🏗️ Architecture

The application uses a modular architecture within the `core/` directory:

*   **`core/bonus/`**: The heart of the system. Contains the `BonusCalculator` engine and ingestion logic.
*   **`core/receipts/`**: Read-only interface for querying sales data.
*   **`core/tier-rules/`**: Logic definitions (e.g., "Bronze Tier = 5 items").
*   **`core/categories/`**: Configuration for sales groups (Steaks, Wines).
*   **`core/participants/`**: Staff management.
*   **`core/forecasts/`**: Revenue target gating configuration.

## 🔌 API Overview

### **Bonus Engine**
*   `POST /api/bonuses/calculate`: Triggers the engine for a specific month/year. Returns a detailed payout report.
*   `POST /api/bonuses/upload-receipts`: Ingests a CSV file of sales data.

### **Receipts (Read-Only)**
*   `GET /api/receipts`: Advanced filtering (Date, Staff, Category, Price) to view the raw data.
*   `GET /api/receipts/stats/summary`: Aggregated statistics for dashboards.

### **Configuration**
*   `GET/POST /api/tier-rules`: Create "games" for staff (e.g., strictly increasing targets).
*   `GET/POST /api/categories`: Define how groups of products behave (`PER_ITEM` vs `PER_CATEGORY`).

## 🧠 Logic Modes Explained

### 1. PER_ITEM Mode
*   **Use Case**: High-ticket items (e.g., Steaks, Champagne).
*   **Logic**: The seller must sell threshold $X$ of a *specific product* to trigger the bonus for that product.
*   *Example*: Selling 4 Ribeyes and 4 Wagyus might result in $0 bonus if the threshold is 5.

### 2. PER_CATEGORY Mode
*   **Use Case**: High-volume items (e.g., Cocktails, Appetizers).
*   **Logic**: The seller's total count of *all items in this category* counts toward the threshold.
*   *Example*: Selling 1 Martini + 4 Mojitos = 5 items. If threshold is 5, bonus is unlocked for all revenue.

## 🧪 Testing

Run the comprehensive test suite to validate logic and API endpoints:

```bash
npm test
```

# 🏨  TopShelf

TopShelf automates the calculation of upsell bonuses for restaurant staff. It replaces the
existing Excel and Macros system with a **JavaScript end-to-end solution**
TopShelf is designed to be **extensible, maintainable, and modular**, allowing you to easily add new categories or rules in the future.

> ⚠️ This repository is dedicated to **backend** implementation.

## 📑 Table of Contents

- [🏨 TopShelf](#-topshelf)
  - [📑 Table of Contents](#-table-of-contents)
  - [Overview](#overview)
  - [💻 Tech Stack](#-tech-stack)
  - [🚀 Getting Started](#-getting-started)
  - [🏃‍♂️ Usage](#-usage)
  - [🧪 Testing](#-testing)
  - [📂 Project Structure](#-project-structure)
  - [⚙️ Configuration](#-configuration)
  - [⚙️ How It Works](#️-how-it-works)
    - [📊 Forecast Check](#-forecast-check)
    - [🎯 Bonus Rules](#-bonus-rules)
  - [License](#license)

---

## Overview

The hotel sets a **monthly forecast** - a revenue goal. Staff bonuses are only applicable if **90% of the forecast** (or configurable threshold) is reached. Once this condition is met, individual staff members are eligible for bonuses based on their sales in different categories.
TopShelf calculates bonuses **per person**, using tiered rules for each category of the item sold.

---
## 💻 Tech Stack

This project is a **Node.js backend**  application using:

- **Node.js** - JavaScript runtime for the backend
- **Express** - Web framework for building REST APIs
- **ES6+ JavaScript** - Modern syntax for classes, modules, and async code
- **MongoDB** - Database for storing records
  
---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd topshelf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🏃‍♂️ Usage

To start the server locally:

```bash
npm start
```

The server will start on `http://localhost:3000`.

---

## 🧪 Testing

TopShelf includes a comprehensive test suite using Jest.

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

---

## 📂 Project Structure

```
.
├── core/         # Business logic (Bonus rules, Participants)
├── src/          # API & Server configuration (Express app)
├── tests/        # Unit tests
├── prisma/       # Database schema
└── utils/        # Utility helpers
```

---

## ⚙️ Configuration

- **Forecast Threshold**: Currently configured in constants (default 90%).
- **Database**: Configure your MongoDB connection string in the `.env` file (see `.env.example`).

---

## ⚙️ How It Works

### 📊 Forecast Check

Before calculating any bonuses, TopShelf checks if the hotel has met the revenue forecast.

- **Threshold:** 90% of the monthly forecast (configurable)
- **Outcome:**
  - If met → bonuses are calculated
  - If not → no bonuses are applied

Implemented in `ForecastChecker`:

---

### 🎯 Bonus Rules

TopShelf uses an abstract `BonusRule` class to define the tiered rules. Each category of item extends this base class to implement its own calculation logic. This keeps the code DRY and extensible.

---

## License

This project is licensed under MIT License.

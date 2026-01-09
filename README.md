# 🏨  Hotel Upsell Bonus Program

This project automates the calcuation of upsell bonuses for restaurant staff. It replaces the
existing Excel and Macros system with a **JavaScript end-to-end solution**
The program is designed to be **extensible, maintainable, and modular**, allowing you to easily add new categorues or rules in the future.

> ⚠️ This repository is dedicated to **backend** implementation.

## 📑 Table of Contents

- [🏨  Hotel Upsell Bonus Program](#--hotel-upsell-bonus-program)
  - [📑 Table of Contents](#-table-of-contents)
  - [Overview](#overview)
  - [💻 Tech Stack](#-tech-stack)
  - [⚙️ How It Works](#️-how-it-works)
    - [📊 Forecast Check](#-forecast-check)
    - [🎯 Bonus Rules](#-bonus-rules)
  - [License](#license)

---

## Overview

The hotel sets a **monthly forecast** - a revenue goal. Staff bonuses are only applicable if **90% of the forecast** (or configurable threshold) is reached. Once this condition. is met, individyal staff members are eligible for bonuses based on their sales in different categories.
The system calculates bonuses **per person**, using tiered rules for each category of the item sold.

---
## 💻 Tech Stack

This project is a **Node.js backend**  application using:

- **Node.js** - JavaScript runtime for the backend
- **Express** - Web framework for building REST APIs
- **ES6+ JavaScript** - Modern syntax for classes, modules, and async code
- **MongoDB** - Database for storing records
  
---

## ⚙️ How It Works

### 📊 Forecast Check

Before calculating any bonuses, the program checks if the hotel has met the revenue forecast.

- **Threshold:** 90% of the monthly forecast (configurable)
- **Outcome:**
  - If met → bonuses are calculated
  - If not → no bonuses are applied

Implemented in `ForecastChecker`:

---

### 🎯 Bonus Rules

The program uses an abstract `BonusRule` class to define the tiered rules. Each category of item extends this base class to implement its own calculation logic. This keeps the code DRY and extensible.

---

## License

This project is licensed under MIT License.

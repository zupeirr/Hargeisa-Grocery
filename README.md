# 🛒 Hargeisa Grocery Platform

[![React](https://img.shields.io/badge/React-18-blue.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748.svg?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> A highly scalable, feature-rich grocery e-commerce platform designed for speed, security, and seamless user experiences.

Hargeisa Grocery is a full-stack, real-time e-commerce application built with modern web technologies. It features a complete customer storefront and an expansive admin dashboard for managing inventory, dynamic categories, real-time deliveries, secure authentications, and financial analytics.

---

## 📸 Screenshots

### Storefront & Admin Dashboard
<details>
<summary>Click to view screenshots</summary>

| Storefront | Admin Dashboard | Admin Login |
|:---:|:---:|:---:|
| ![Storefront](screenshots/storefront.png) | ![Admin Dashboard](screenshots/admin-dashboard.png) | ![Admin Login](screenshots/admin-login.png) |

*(Note: Create a `screenshots` folder in your repository root and add your images there named as above to display them)*
</details>

---

## ✨ Features

### 🛍️ Storefront (Customer Facing)
- **Dynamic Product Catalog:** Real-time synced inventory and categories.
- **Secure Authentication:** JWT-based user sessions with encrypted passwords via `bcryptjs`.
- **Smart Shopping Cart:** Persistent, interactive shopping cart with multi-currency handling.
- **Live Order Tracking:** Real-time updates via Socket.IO for in-transit deliveries.
- **Multi-Payment Integrations:** Supports ZAAD, EVC, Edahab, and Cash on Delivery (COD).
- **Ratings & Reviews:** Submit and browse user-generated product ratings.

### 🛠️ Admin Dashboard (Management)
- **Inventory Management:** Full CRUD capabilities for products, categories, suppliers, and purchase orders.
- **Financial Analytics:** Live dashboard for total revenue, profit margin calculations, and expense tracking.
- **Delivery & Staff Management:** Assign drivers, dispatch orders, and track employee attendances and salaries.
- **Secure Uploads:** Authenticated media uploads for product images.
- **Coupon & Review Moderation:** Manage customer feedback and issue promotional discounts.

---

## 💻 Tech Stack

### Frontend Architecture
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Context API & LocalStorage

### Backend Architecture
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database ORM:** Prisma
- **Real-Time Engine:** Socket.IO
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Security:** Helmet, Express Rate Limit, CORS
- **Performance:** Compression

### 🏗️ Development & Build Tools
- **Package Manager:** npm
- **Linter:** ESLint
- **Database GUI & CLI:** Prisma Studio & Prisma CLI
- **Hot-Reloading:** Vite (Frontend) & Nodemon (Backend)
- **Version Control:** Git

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A relational database (PostgreSQL / MySQL) supported by Prisma.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hargeisa-grocery.git
   cd hargeisa-grocery
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/hargeisa_grocery?schema=public"
   JWT_SECRET="your_super_secret_jwt_key"
   API_BASE_URL="http://localhost:3001"
   FRONTEND_URL="http://localhost:5173"
   ```
   *Note: Ensure your `DATABASE_URL` matches your local database setup.*

3. **Initialize Database & Seed Data:**
   ```bash
   npx prisma db push
   npm run seed
   ```

4. **Setup the Frontend:**
   ```bash
   cd ../
   npm install
   ```
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

### Running the Application

Open two terminal instances:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api/health

---

## 🔒 Security Practices

- **Password Hashing:** Passwords are never stored in plain text. `bcryptjs` is strictly enforced.
- **Protected Routes:** Both API and frontend routes are guarded by strict role-based access controllers.
- **Environment Parity:** Explicit `.env` validations halt server booting if critical secrets are missing in production environments.
- **CORS & Rate Limiting:** Enforced cross-origin resource sharing policies and request throttling to prevent DDoS and brute-force attacks.

---

## 📜 License

This project is private and proprietary. Unauthorized copying of this file, via any medium, is strictly prohibited.

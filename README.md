# Hargeisa Grocery - E-commerce Platform

A modern grocery e-commerce platform built with React, TypeScript, and MySQL.

   ## Features    

- 🛒 Product catalog with categories
- 👤 User authentication and registration
- 🛍️ Shopping cart functionality
- 📦 Order management and tracking
- 📍 Multiple delivery addresses
- 💳 Multiple payment methods (ZAAD, EVC, Edahab, COD)
- ⭐ Product ratings and reviews
- 🎨 Modern, responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
-  Tailwind CSS
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs (password hashing)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)

2. **Install frontend dependencies:**
```bash
cd Hargeisa-Grocery
npm install
```

3. **Install backend dependencies:**
```bash
cd server
npm install
```

4. **Set up the database:**
   - Make sure MySQL is running
   - Create a `.env` file in the `server` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hargeisa_grocery
   DB_PORT=3306
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   ```

5. **Start the backend server:**
```bash
cd server
npm start
```

6. **Seed the database with products:**
```bash
cd server
npm run seed
```

7. **Start the frontend development server:**
```bash
cd Hargeisa-Grocery
npm run dev
```

8. **Open your browser:**
   - Frontend: http://localhost:5173 (or the port shown in terminal)
   - Backend API: http://localhost:5000

## Project Structure

```
Hargeisa-Grocery/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, Cart)
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   └── data/           # Static data (legacy, now using API)
├── server/
│   ├── config/         # Database configuration
│   ├── routes/         # API route handlers
│   ├── scripts/        # Database seeding scripts
│   └── server.js       # Main server file
└── package.json
```

## Environment Variables

### Frontend (.env in root)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env in server/)
See server/README.md for details

## API Documentation

See `server/README.md` for complete API endpoint documentation.

## Default Credentials

After seeding, you can register a new account or use the API to create one.

## Development

- Frontend runs on Vite dev server with hot reload
- Backend runs on Node.js with Express
- Database tables are created automatically on first run

## Building for Production

### Frontend
```bash
npm run build
```

### Backend
The server is ready for production deployment. Make sure to:
- Set proper environment variables
- Use a production database
- Enable HTTPS
- Configure CORS properly

## License

This project is private and proprietary.

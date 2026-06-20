# Hargeisa Grocery - Data Flow Architecture

## System Overview
Three-layered architecture: **Presentation → Application → Data**

---

## 1. PRESENTATION LAYER (Frontend)

### Components
- **Storefront**: Customer-facing interface for browsing and purchasing
- **Admin Panel**: Administrative dashboard for inventory and business management
- **State Management**: React Context API (Cart, Auth) + React Router

### Technology Stack
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Recharts (Data visualization)

---

## 2. APPLICATION LAYER (Backend)

### REST API Endpoints

#### Authentication
```
POST /api/auth/login
├─ Input: { email, password }
├─ Validation: Email format, password strength
├─ Process: Validate credentials → Hash comparison (bcryptjs)
└─ Output: JWT token + User data

POST /api/auth/register
├─ Input: { email, password, name }
├─ Process: Hash password → Create user in DB
└─ Output: Success message + New user ID
```

#### Product Management
```
GET /api/products
├─ Query params: ?category, ?sort, ?page
├─ Process: Query DB with Prisma
└─ Output: Products array with prices, images, stock

GET /api/products/:id
├─ Process: Fetch single product + supplier info + reviews
└─ Output: Detailed product object

POST /api/products (Admin only)
├─ Input: { name, price, category, description, sku, supplierId }
├─ Auth: JWT verification
├─ Process: Validate data → Save to DB
└─ Output: Created product with ID

PUT /api/products/:id (Admin only)
├─ Input: Updated product fields
├─ Process: Validate → Update DB
└─ Output: Updated product

DELETE /api/products/:id (Admin only)
├─ Process: Soft delete (mark as inactive)
└─ Output: Success confirmation
```

#### Order Management
```
POST /api/orders
├─ Input: { customerId, items[], deliveryAddress, paymentMethod }
├─ Process:
│  ├─ Validate items availability
│  ├─ Calculate total with discount codes
│  ├─ Create order record
│  ├─ Create OrderItems (junction records)
│  └─ Reduce product stock levels
├─ Auth: JWT verification
└─ Output: Order confirmation + Order ID

GET /api/orders
├─ Query params: ?customerId (for customers), ?status (for admin)
├─ Auth: JWT verification
├─ Process: Query orders with customer/items data
└─ Output: Orders array with detailed info

PUT /api/orders/:id/status (Admin only)
├─ Input: { status: "confirmed" | "preparing" | "out-for-delivery" | "delivered" }
├─ Auth: JWT verification
├─ Process: Update order status → Trigger notifications
└─ Output: Updated order
```

#### Supplier Management
```
GET /api/suppliers
├─ Process: Fetch all suppliers with performance metrics
└─ Output: Suppliers array

POST /api/suppliers (Admin only)
├─ Input: { name, email, phone, address, rating }
├─ Process: Validate → Save supplier
└─ Output: Created supplier

PUT /api/suppliers/:id (Admin only)
├─ Process: Update supplier info
└─ Output: Updated supplier
```

#### Purchase Orders
```
POST /api/purchase-orders (Admin only)
├─ Input: { supplierId, items: [{ productId, quantity, unitCost }] }
├─ Process:
│  ├─ Create PO record (status: "draft")
│  ├─ Create PoItems (junction records)
│  └─ Calculate total amount
└─ Output: PO with ID

PUT /api/purchase-orders/:id (Admin only)
├─ Input: { status: "draft" | "sent" | "received" | "cancelled" }
├─ Process:
│  └─ If "received": Update product stock levels
└─ Output: Updated PO

PUT /api/purchase-orders/:id/items (Admin only)
├─ Input: Add/remove items from PO
├─ Process: Update PoItems junction table
└─ Output: Updated PO
```

#### Customer Management
```
GET /api/customers (Admin only)
├─ Process: Fetch all customers with stats
└─ Output: Customers array with segment, loyalty points, spend

GET /api/customers/:id
├─ Process: Get customer profile + order history
└─ Output: Customer detail with analytics
```

#### Discount Codes
```
POST /api/discount-codes (Admin only)
├─ Input: { code, discountPct, maxUses, validFrom, validUntil }
├─ Process: Validate → Create code
└─ Output: Created discount code

GET /api/discount-codes/validate/:code
├─ Input: Discount code
├─ Process: 
│  ├─ Check if code exists
│  ├─ Validate expiration date
│  ├─ Check usage limit
│  └─ Return discount percentage
└─ Output: { valid: true, discountPct: 10.0 } or error
```

#### Expenses
```
POST /api/expenses (Admin only)
├─ Input: { category, amount, description }
├─ Process: Save expense to DB
└─ Output: Created expense

GET /api/expenses
├─ Query params: ?category, ?fromDate, ?toDate
├─ Process: Query expenses + aggregate by category
└─ Output: Expenses array with analytics

GET /api/expenses/report
├─ Process: Generate financial report
└─ Output: Total expenses by category, monthly trends
```

### Middleware Stack
- **Authentication Middleware**: JWT token validation on protected routes
- **CORS Middleware**: Allow frontend to communicate with backend
- **Error Handling**: Global error handler for consistent error responses
- **Request Validation**: Validate incoming data schemas
- **Password Security**: bcryptjs for hashing passwords

---

## 3. DATA LAYER

### Prisma ORM
- Type-safe database queries
- Automatic migrations
- Relationship management

### Database Models & Relationships

```
User
├─ Fields: id, email, password (hashed), name, role, createdAt, updatedAt
└─ Purpose: Admin authentication

Customer
├─ Fields: id, name, email, phone, loyaltyPoints, segment, totalSpent
├─ Relations: 1:Many with Order
└─ Purpose: Customer profiles & analytics

Product
├─ Fields: id, name, price, category, sku, stockLevel, rating
├─ Relations: 
│  ├─ Many:1 with Supplier
│  └─ 1:Many with OrderItem & PoItem
└─ Purpose: Product catalog & inventory

Order
├─ Fields: id, customerId, status, total, paymentMethod, orderDate
├─ Relations:
│  ├─ Many:1 with Customer
│  └─ 1:Many with OrderItem
└─ Purpose: Customer purchase records

OrderItem
├─ Fields: id, orderId, productId, quantity, price (snapshot)
├─ Relations: Many:1 with Order & Product
└─ Purpose: Line items for orders (junction table)

Supplier
├─ Fields: id, name, email, phone, address, rating
├─ Relations:
│  ├─ 1:Many with Product
│  └─ 1:Many with PurchaseOrder
└─ Purpose: Vendor information

PurchaseOrder
├─ Fields: id, supplierId, status, totalAmount, orderDate
├─ Relations:
│  ├─ Many:1 with Supplier
│  └─ 1:Many with PoItem
└─ Purpose: Inventory replenishment orders

PoItem
├─ Fields: id, purchaseOrderId, productId, quantity, unitCost
├─ Relations: Many:1 with PurchaseOrder & Product
└─ Purpose: Line items for purchase orders (junction table)

DiscountCode
├─ Fields: id, code (unique), discountPct, maxUses, uses, validUntil
└─ Purpose: Promotional discounts

Expense
├─ Fields: id, category, amount, date, description
└─ Purpose: Financial tracking (utilities, payroll, marketing)

Setting
├─ Fields: id, key (unique), value (JSON string)
└─ Purpose: System configuration
```

### SQLite Database
- **File**: `dev.db`
- **Type**: Lightweight, file-based SQL database
- **Advantages**: No server setup, perfect for development, easy backups
- **Storage**: All data persists in single file

---

## 4. END-TO-END DATA FLOWS

### Flow 1: Customer Purchase Journey
```
┌─ PRESENTATION ──────────────────────┐
│ Customer browses products           │
│ (React Frontend)                    │
└──────────────┬──────────────────────┘
               │ GET /api/products
               ▼
┌─ APPLICATION ───────────────────────┐
│ Product Routes Handler              │
│ - Query validation                  │
│ - Database query preparation        │
└──────────────┬──────────────────────┘
               │ Prisma Query
               ▼
┌─ DATA LAYER ────────────────────────┐
│ SELECT * FROM Product               │
│ WHERE category = ? AND inStock = 1  │
└──────────────┬──────────────────────┘
               │ Returns: Product[]
               ▼
┌─ APPLICATION ───────────────────────┐
│ Format response                     │
│ Filter by price/rating              │
│ Return JSON                         │
└──────────────┬──────────────────────┘
               │ HTTP 200 + Products
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Display products in UI              │
│ Add to Cart (stored in Context)     │
└──────────────┬──────────────────────┘
               │ POST /api/orders
               ▼
┌─ APPLICATION ───────────────────────┐
│ Order Routes Handler                │
│ - Validate JWT token                │
│ - Calculate total with discount     │
│ - Validate inventory availability   │
└──────────────┬──────────────────────┘
               │ Prisma Transactions
               ▼
┌─ DATA LAYER ────────────────────────┐
│ BEGIN TRANSACTION                   │
│ INSERT INTO Order (...)             │
│ INSERT INTO OrderItem (...) x N     │
│ UPDATE Product SET stockLevel = ... │
│ COMMIT                              │
└──────────────┬──────────────────────┘
               │ Order ID
               ▼
┌─ APPLICATION ───────────────────────┐
│ Return success + Order confirmation │
└──────────────┬──────────────────────┘
               │ HTTP 201 + Order
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Show order confirmation             │
│ Redirect to tracking page           │
│ Clear cart context                  │
└─────────────────────────────────────┘
```

### Flow 2: Admin Inventory Replenishment
```
┌─ PRESENTATION ──────────────────────┐
│ Admin creates purchase order        │
│ (Admin Dashboard)                   │
└──────────────┬──────────────────────┘
               │ POST /api/purchase-orders
               ▼
┌─ APPLICATION ───────────────────────┐
│ Supplier Routes Handler             │
│ - Verify JWT (admin role)           │
│ - Validate supplier exists          │
│ - Calculate total cost              │
└──────────────┬──────────────────────┘
               │ Prisma Write
               ▼
┌─ DATA LAYER ────────────────────────┐
│ INSERT INTO PurchaseOrder (...)     │
│ INSERT INTO PoItem (...) x N        │
└──────────────┬──────────────────────┘
               │ PO ID
               ▼
┌─ APPLICATION ───────────────────────┐
│ Return PO with ID (status: draft)   │
└──────────────┬──────────────────────┘
               │ HTTP 201
               ▼
         [PO Sent to Supplier]
         
         [Goods Received]
         
         [PUT /api/purchase-orders/:id]
               │ Update status: "received"
               ▼
┌─ APPLICATION ───────────────────────┐
│ Update PO status                    │
│ Trigger stock update                │
└──────────────┬──────────────────────┘
               │ Prisma Transaction
               ▼
┌─ DATA LAYER ────────────────────────┐
│ UPDATE PurchaseOrder SET status ... │
│ UPDATE Product SET stockLevel = ... │
│ (for each PoItem)                   │
└──────────────┬──────────────────────┘
               │ Success
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Update inventory display            │
│ Show updated stock levels           │
│ Clear low-stock alerts              │
└─────────────────────────────────────┘
```

### Flow 3: Authentication & Security
```
┌─ PRESENTATION ──────────────────────┐
│ User enters credentials             │
│ POST /api/auth/login                │
└──────────────┬──────────────────────┘
               │ { email, password }
               ▼
┌─ APPLICATION ───────────────────────┐
│ Auth Routes Handler                 │
│ - Validate email format             │
│ - Query user by email               │
└──────────────┬──────────────────────┘
               │ Prisma Query
               ▼
┌─ DATA LAYER ────────────────────────┐
│ SELECT * FROM User WHERE email = ?  │
└──────────────┬──────────────────────┘
               │ User record
               ▼
┌─ APPLICATION ───────────────────────┐
│ bcryptjs: Compare password hash     │
│ - Input password hash vs DB hash    │
│ - Generate JWT token                │
│ - Token expires: 24h                │
└──────────────┬──────────────────────┘
               │ JWT Token
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Store token (localStorage)          │
│ Set Auth Context                    │
│ Redirect to dashboard               │
└──────────────┬──────────────────────┘

[Subsequent API Request]
               │
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Include JWT in Authorization header │
│ Authorization: Bearer <token>       │
└──────────────┬──────────────────────┘
               │ Request with token
               ▼
┌─ APPLICATION ───────────────────────┐
│ Auth Middleware                     │
│ - Extract JWT from header           │
│ - Verify signature & expiration     │
│ - Attach user to request            │
└──────────────┬──────────────────────┘
               │ Valid? Proceed
               ▼
┌─ PROTECTED ROUTE HANDLER ───────────┐
│ Process request with authenticated  │
│ user context                        │
└─────────────────────────────────────┘
```

### Flow 4: Analytics & Reporting
```
┌─ PRESENTATION ──────────────────────┐
│ Admin views dashboard               │
│ GET /api/orders                     │
│ GET /api/customers                  │
│ GET /api/expenses/report            │
└──────────────┬──────────────────────┘
               │ Multiple API calls
               ▼
┌─ APPLICATION ───────────────────────┐
│ Analytics Routes Handlers           │
│ - Aggregate data queries            │
│ - Apply filters (date range, etc)   │
└──────────────┬──────────────────────┘
               │ Complex Prisma queries
               ▼
┌─ DATA LAYER ────────────────────────┐
│ SELECT COUNT(*), SUM(total)         │
│ FROM Order WHERE orderDate >= ?     │
│ GROUP BY DATE(orderDate)            │
│                                     │
│ SELECT segment, COUNT(*), SUM(...) │
│ FROM Customer GROUP BY segment      │
│                                     │
│ SELECT category, SUM(amount)        │
│ FROM Expense GROUP BY category      │
└──────────────┬──────────────────────┘
               │ Aggregated data
               ▼
┌─ APPLICATION ───────────────────────┐
│ Format results                      │
│ Combine data for reporting          │
└──────────────┬──────────────────────┘
               │ JSON response
               ▼
┌─ PRESENTATION ──────────────────────┐
│ Recharts renders visualizations     │
│ - Revenue trends                    │
│ - Customer segments pie chart       │
│ - Expense breakdown                 │
└─────────────────────────────────────┘
```

---

## 5. Data Persistence & Consistency

### Transaction Management (Prisma)
```prisma
// Atomic order creation with inventory update
const order = await prisma.$transaction(async (tx) => {
  // Create order
  const newOrder = await tx.order.create({ data: {...} })
  
  // Create order items
  await tx.orderItem.createMany({ data: items })
  
  // Update product stock
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockLevel: { decrement: item.quantity } }
    })
  }
  
  return newOrder
})
```

### Data Validation
- **Input Validation**: Validate all incoming requests before DB operations
- **Schema Validation**: Prisma enforces schema constraints
- **Business Logic Validation**: Check inventory before orders, verify discounts, validate supplier references

### Error Handling
- **Database Errors**: Prisma throws descriptive errors
- **API Response**: Standardized error format with HTTP status codes
- **Frontend**: Display user-friendly error messages

---

## 6. Performance Optimizations

### Query Optimization
```
- Index frequently queried fields (email, productId, customerId)
- Use Prisma select to fetch only needed fields
- Implement pagination for large result sets
- Cache frequently accessed data (products, suppliers)
```

### Caching Strategies
```
- Product list: Cache for 5 minutes (low update frequency)
- Stock levels: Real-time (critical)
- Supplier data: Cache for 1 hour
- User sessions: In-memory with JWT validation
```

---

## 7. Security Measures

| Layer | Security | Implementation |
|-------|----------|-----------------|
| **Auth** | Password hashing | bcryptjs with salt rounds |
| **Auth** | Token validation | JWT verification on protected routes |
| **API** | CORS | Restrict to frontend domain |
| **DB** | SQL Injection | Prisma parameterized queries |
| **Validation** | Input sanitization | Schema validation before DB ops |
| **Transport** | HTTPS | Required for production |


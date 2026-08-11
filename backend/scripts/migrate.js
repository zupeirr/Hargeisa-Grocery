const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function migrateData() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host: 'reseau.proxy.rlwy.net',
    port: 22103,
    user: 'root',
    password: 'tSTCMteCtYrwBwVthhYnrFMbSwCkvLSt',
    database: 'railway'
  });

  console.log('Connected to MySQL successfully. Connecting to PostgreSQL...');
  await prisma.$connect();
  console.log('Connected to PostgreSQL successfully.');

  // The order is important due to foreign key constraints
  const tables = [
    { name: 'Category', prismaModel: prisma.category },
    { name: 'Setting', prismaModel: prisma.setting },
    { name: 'User', prismaModel: prisma.user },
    { name: 'Customer', prismaModel: prisma.customer },
    { name: 'Supplier', prismaModel: prisma.supplier },
    { name: 'Employee', prismaModel: prisma.employee },
    { name: 'DiscountCode', prismaModel: prisma.discountCode, booleans: ['active'] },
    { name: 'Expense', prismaModel: prisma.expense },
    { name: 'Product', prismaModel: prisma.product, booleans: ['inStock', 'isDamaged'] },
    { name: 'Order', prismaModel: prisma.order },
    { name: 'OrderItem', prismaModel: prisma.orderItem },
    { name: 'Delivery', prismaModel: prisma.delivery },
    { name: 'PurchaseOrder', prismaModel: prisma.purchaseOrder },
    { name: 'PoItem', prismaModel: prisma.poItem },
    { name: 'InventoryTransaction', prismaModel: prisma.inventoryTransaction },
    { name: 'Review', prismaModel: prisma.review },
    { name: 'Attendance', prismaModel: prisma.attendance },
    { name: 'SalaryRecord', prismaModel: prisma.salaryRecord }
  ];

  for (const table of tables) {
    try {
      console.log(`Migrating table: ${table.name}...`);
      const [rows] = await connection.execute(`SELECT * FROM ${table.name}`);
      console.log(`Found ${rows.length} rows in ${table.name}`);

      if (rows.length === 0) continue;

      // Handle boolean conversions from MySQL tinyint to JavaScript boolean
      const mappedRows = rows.map(row => {
        if (table.booleans) {
          table.booleans.forEach(field => {
            if (row[field] !== undefined && row[field] !== null) {
              row[field] = row[field] === 1;
            }
          });
        }
        return row;
      });

      // Insert into PostgreSQL
      await table.prismaModel.createMany({
        data: mappedRows,
        skipDuplicates: true
      });
      console.log(`Successfully migrated ${table.name}`);
    } catch (error) {
      console.error(`Error migrating table ${table.name}:`, error);
    }
  }

  await connection.end();
  await prisma.$disconnect();
  console.log('Migration complete!');
}

migrateData().catch(console.error);

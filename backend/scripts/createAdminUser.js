const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Existing users:', users.length);

  if (users.length === 0) {
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hargeisa.com',
        // Note: the backend handles login securely. We need to hash the password here if login expects hashed passwords.
        password: 'AdminPassword2026!',
        name: 'Admin User',
        role: 'admin',
      },
    });
    console.log('✅ Admin user created successfully:', admin.email);
  } else {
    console.log('Users already exist:', users.map(u => u.email));
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

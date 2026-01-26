import { drizzle } from 'drizzle-orm/mysql2';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function initAdmin() {
  console.log('🚀 Initializing admin account...');
  
  const db = drizzle(DATABASE_URL);
  
  // 检查admin用户是否已存在
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@system.local'))
    .limit(1);
  
  if (existingAdmin) {
    console.log('ℹ️  Admin account already exists');
    console.log(`   Email: admin@system.local`);
    console.log(`   Role: ${existingAdmin.role}`);
    return;
  }
  
  // 创建admin用户
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await db.insert(users).values({
    openId: null,
    email: 'admin@system.local',
    password: hashedPassword,
    name: 'Administrator',
    loginMethod: 'email',
    emailVerified: true,
    mustChangePassword: true,
    role: 'admin',
  });
  
  console.log('✅ Admin account created successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Email: admin@system.local');
  console.log('   Password: 123456');
  console.log('');
  console.log('⚠️  IMPORTANT: You must change the password on first login!');
}

initAdmin()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

// server/scripts/seedDemoUser.ts

import db from '../db.js';
import { users } from '../../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function seedDemoUser() {
  const email = 'admin@lifebridge.dev';
  const plainPassword = 'SuperSecure123!';

  const existing = await db.select().from(users).where(eq(users.email, email));

  if (existing.length > 0) {
    console.log('✅ Demo user already exists.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  await db.insert(users).values({
    name: 'Demo Admin',
    email,
    password: hashedPassword,
    role: 'ADMIN', // Change if your schema uses something else
  });

  console.log('✅ Demo user created!');
  process.exit(0);
}

seedDemoUser().catch((err) => {
  console.error('❌ Error seeding user:', err);
  process.exit(1);
});

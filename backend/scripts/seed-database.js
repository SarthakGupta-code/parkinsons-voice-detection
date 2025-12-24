/**
 * Database Seeding Script
 * Creates sample data for development and testing
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/config');

const pool = new Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create test users
    const users = [
      {
        id: uuidv4(),
        email: 'asha@test.com',
        password: 'Test1234!',
        name: 'ASHA Worker Test',
        role: 'healthcare_worker',
        phone: '+911234567890',
      },
      {
        id: uuidv4(),
        email: 'patient@test.com',
        password: 'Test1234!',
        name: 'Patient Test',
        role: 'patient',
        phone: '+911234567891',
      },
      {
        id: uuidv4(),
        email: 'doctor@test.com',
        password: 'Test1234!',
        name: 'Dr. Specialist',
        role: 'specialist',
        phone: '+911234567892',
      },
    ];

    console.log('Creating test users...');
    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, config.BCRYPT_ROUNDS);
      
      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role, phone, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true, true)
         ON CONFLICT (email) DO NOTHING`,
        [userData.id, userData.email, passwordHash, userData.name, userData.role, userData.phone]
      );
      
      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    // Create test patients
    const ashaUser = users.find(u => u.role === 'healthcare_worker');
    const patients = [
      {
        id: uuidv4(),
        name: 'Rajesh Kumar',
        age: 68,
        gender: 'male',
        village: 'Rampur',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        assigned_worker_id: ashaUser.id,
      },
      {
        id: uuidv4(),
        name: 'Sita Devi',
        age: 72,
        gender: 'female',
        village: 'Bhimpur',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        assigned_worker_id: ashaUser.id,
      },
    ];

    console.log('\nCreating test patients...');
    for (const patientData of patients) {
      await pool.query(
        `INSERT INTO patients (id, age, gender, village, district, state, assigned_worker_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          patientData.id,
          patientData.age,
          patientData.gender,
          patientData.village,
          patientData.district,
          patientData.state,
          patientData.assigned_worker_id,
        ]
      );
      
      console.log(`✓ Created patient: ${patientData.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('ASHA Worker: asha@test.com / Test1234!');
    console.log('Patient: patient@test.com / Test1234!');
    console.log('Specialist: doctor@test.com / Test1234!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();


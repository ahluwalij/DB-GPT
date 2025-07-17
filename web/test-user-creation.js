const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function testUserCreation() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'aa123456',
      database: 'dbgpt',
      port: 3306
    });

    // Insert test user
    const userId = uuidv4();
    const email = `test${Date.now()}@example.com`;
    const name = 'Test User';
    
    const [result] = await connection.execute(
      'INSERT INTO user (id, name, email, email_verified, password) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, false, 'hashed-password']
    );
    
    console.log('User created successfully:', result);
    
    // Query the user back
    const [users] = await connection.execute('SELECT * FROM user WHERE id = ?', [userId]);
    console.log('User retrieved:', users[0]);
    
    await connection.end();
  } catch (error) {
    console.error('Database test failed:', error.message);
  }
}

testUserCreation();
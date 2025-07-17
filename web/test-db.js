const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'aa123456',
      database: 'dbgpt',
      port: 3306
    });

    console.log('Database connection successful');
    
    // Check if auth tables exist
    const [rows] = await connection.execute("SHOW TABLES LIKE '%user%'");
    console.log('User-related tables:', rows);
    
    // Try to describe the user table structure
    try {
      const [userSchema] = await connection.execute("DESCRIBE user");
      console.log('User table schema:', userSchema);
    } catch (e) {
      console.log('User table does not exist or cannot be described:', e.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

testConnection();
const mysql = require('mysql2/promise');

async function checkAuthTables() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'aa123456',
      database: 'dbgpt',
      port: 3306
    });

    console.log('Checking auth tables...');
    
    const authTables = ['user', 'session', 'account', 'verification'];
    
    for (const table of authTables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✓ ${table} table exists`);
          const [schema] = await connection.execute(`DESCRIBE ${table}`);
          console.log(`  Schema: ${schema.map(s => s.Field).join(', ')}`);
        } else {
          console.log(`✗ ${table} table missing`);
        }
      } catch (e) {
        console.log(`✗ Error checking ${table}: ${e.message}`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

checkAuthTables();
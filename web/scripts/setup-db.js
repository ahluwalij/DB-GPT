const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'aa123456',
    database: 'dbgpt',
  });

  try {
    console.log('Connected to MySQL database');
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📋 Available tables:', tableNames);
    
    const requiredTables = ['account', 'chat_message', 'chat_thread', 'project', 'session', 'user', 'verification'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('🔧 Missing tables:', missingTables);
      console.log('📄 Creating missing tables...');
      
      // Read the SQL file
      const sqlPath = path.join(__dirname, 'create-auth-tables.sql');
      
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sqlContent.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              console.log('Executing:', statement.trim().substring(0, 50) + '...');
              await connection.execute(statement.trim());
            } catch (err) {
              if (!err.message.includes('already exists')) {
                console.log('Warning:', err.message);
              }
            }
          }
        }
        
        console.log('✅ Database tables created successfully!');
      } else {
        console.log('❌ SQL file not found.');
      }
    } else {
      console.log('✅ All required tables already exist!');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await connection.end();
  }
}

setupDatabase();
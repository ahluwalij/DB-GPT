const mysql = require('mysql2/promise');

async function checkSchemaMismatch() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'aa123456',
      database: 'dbgpt',
      port: 3306
    });

    console.log('Checking schema field names...');
    
    // Check user table
    const [userSchema] = await connection.execute("DESCRIBE user");
    console.log('\nUser table fields:');
    userSchema.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check expected vs actual field names
    const expectedFields = {
      user: ['id', 'name', 'email', 'emailVerified', 'password', 'image', 'createdAt', 'updatedAt'],
      session: ['id', 'expiresAt', 'token', 'createdAt', 'updatedAt', 'ipAddress', 'userAgent', 'userId'],
      account: ['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'password', 'createdAt', 'updatedAt'],
      verification: ['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt']
    };
    
    for (const [tableName, expectedFieldNames] of Object.entries(expectedFields)) {
      console.log(`\nChecking ${tableName} table...`);
      const [schema] = await connection.execute(`DESCRIBE ${tableName}`);
      const actualFields = schema.map(s => s.Field);
      
      console.log(`  Actual fields: ${actualFields.join(', ')}`);
      console.log(`  Expected fields: ${expectedFieldNames.join(', ')}`);
      
      const missing = expectedFieldNames.filter(field => !actualFields.includes(field));
      const extra = actualFields.filter(field => !expectedFieldNames.includes(field));
      
      if (missing.length > 0) {
        console.log(`  Missing fields: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`  Extra fields: ${extra.join(', ')}`);
      }
      if (missing.length === 0 && extra.length === 0) {
        console.log(`  ✓ All fields match`);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Schema check failed:', error.message);
  }
}

checkSchemaMismatch();
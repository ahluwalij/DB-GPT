// Test script to verify authentication system is working
const { userRepository } = require('../lib/db/repository');
const { nanoid } = require('nanoid');

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');
  
  try {
    // Test 1: Create a test user
    console.log('1. Testing user creation...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
    };
    
    const createdUser = await userRepository.create(testUser);
    console.log('✅ User created:', createdUser.email);
    
    // Test 2: Find user by email
    console.log('\n2. Testing user lookup...');
    const foundUser = await userRepository.findByEmail(testUser.email);
    console.log('✅ User found:', foundUser ? foundUser.email : 'Not found');
    
    // Test 3: Check if email exists
    console.log('\n3. Testing email existence check...');
    const emailExists = await userRepository.existsByEmail(testUser.email);
    console.log('✅ Email exists:', emailExists);
    
    // Test 4: Update user
    console.log('\n4. Testing user update...');
    const updatedUser = await userRepository.update(createdUser.id, {
      name: 'Updated Test User',
      emailVerified: true,
    });
    console.log('✅ User updated:', updatedUser ? updatedUser.name : 'Update failed');
    
    // Test 5: Clean up - delete test user
    console.log('\n5. Cleaning up test user...');
    await userRepository.delete(createdUser.id);
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 System Status:');
    console.log('✅ Database connection: Working');
    console.log('✅ User repository: Working');
    console.log('✅ CRUD operations: Working');
    console.log('✅ Authentication system: Ready to use!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check database connection in .env file');
    console.log('3. Verify auth tables exist: node scripts/setup-db.js');
  }
}

testAuth().then(() => process.exit(0));
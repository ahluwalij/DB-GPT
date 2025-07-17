const fetch = require('node-fetch');

async function testSignup() {
  try {
    console.log('Testing signup endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('Signup test failed:', error.message);
  }
}

testSignup();
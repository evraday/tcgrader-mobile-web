// Test script for login API
const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('https://www.tcgrader.com/api/auth/login', {
      email: 'hello@tcgrader.com',
      password: 'shadow99',
      captchaToken: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001',
        'Referer': 'http://localhost:3001/'
      }
    });

    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
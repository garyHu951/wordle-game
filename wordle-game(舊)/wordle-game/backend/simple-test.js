console.log('Test 1: Basic console output');

try {
  console.log('Test 2: Trying to require express');
  const express = require('express');
  console.log('Test 3: Express loaded successfully');
  
  console.log('Test 4: Creating app');
  const app = express();
  console.log('Test 5: App created successfully');
  
  console.log('Test 6: Setting up basic route');
  app.get('/', (req, res) => {
    res.send('Hello World');
  });
  
  console.log('Test 7: Starting server on port 3001');
  const server = app.listen(3001, () => {
    console.log('Test 8: Server started successfully on port 3001');
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
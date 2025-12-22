console.log('Starting server test...');

try {
  const express = require('express');
  console.log('Express loaded successfully');
  
  const cors = require('cors');
  console.log('CORS loaded successfully');
  
  const bodyParser = require('body-parser');
  console.log('Body-parser loaded successfully');
  
  const fs = require('fs');
  console.log('FS loaded successfully');
  
  const path = require('path');
  console.log('Path loaded successfully');
  
  const http = require('http');
  console.log('HTTP loaded successfully');
  
  const { Server } = require("socket.io");
  console.log('Socket.IO loaded successfully');
  
  console.log('All modules loaded successfully!');
  
  // Test file reading
  const fileName = '5-letter-words.json';
  const filePath = path.join(__dirname, fileName);
  console.log('Trying to read file:', filePath);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const words = JSON.parse(fileContent);
  console.log('Successfully loaded', words.length, 'words');
  
  console.log('Test completed successfully!');
  
} catch (error) {
  console.error('Error occurred:', error.message);
  console.error('Stack trace:', error.stack);
}
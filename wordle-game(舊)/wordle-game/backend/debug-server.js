console.log('=== DEBUG SERVER START ===');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Arguments:', process.argv);

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  console.log('Loading server.js...');
  require('./server.js');
  console.log('Server.js loaded successfully');
} catch (error) {
  console.error('Error loading server.js:', error);
  process.exit(1);
}
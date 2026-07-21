process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

try {
  console.log('Starting server...');
  console.log('NODE:', process.version);
  console.log('CWD:', process.cwd());
  console.log('PORT:', process.env.PORT);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('Loading next...');
  require('./server.js');
} catch (err) {
  console.error('FATAL:', err);
  process.exit(1);
}
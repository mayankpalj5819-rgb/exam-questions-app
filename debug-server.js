const http = require('http');
const path = require('path');

const server = http.createServer((req, res) => {
  let output = '';
  
  if (req.url === '/try-start') {
    try {
      process.chdir(path.join(process.cwd(), '.next', 'standalone'));
      process.env.DATABASE_URL = 'file:./db/custom.db';
      process.env.NEXTAUTH_URL = 'https://jee-pyq-vault.onrender.com';
      process.env.NEXTAUTH_SECRET = 'prod-secret';
      process.env.PORT = '10001';
      
      output += `CWD: ${process.cwd()}\n`;
      output += `Attempting require('next')...\n`;
      const next = require('next');
      output += `Next loaded: ${typeof next}\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(output);
      // Don't actually start it, just test the require
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`ERROR: ${err.message}\n${err.stack}`);
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`OK - Node ${process.version} - visit /try-start to test`);
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Debug on ${process.env.PORT || 3000}`);
});
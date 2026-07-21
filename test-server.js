const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`OK - Node ${process.version} - PORT ${process.env.PORT} - CWD ${process.cwd()}`);
});
server.listen(process.env.PORT || 3000, () => {
  console.log(`Test server running on port ${process.env.PORT || 3000}`);
});
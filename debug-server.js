const http = require('http');
const { execSync } = require('child_process');

const server = http.createServer((req, res) => {
  let output = '';
  try {
    output += `Node: ${process.version}\n`;
    output += `CWD: ${process.cwd()}\n`;
    output += `PORT: ${process.env.PORT}\n`;
    output += `DATABASE_URL: ${process.env.DATABASE_URL}\n`;
    output += `Files in cwd:\n`;
    output += execSync('ls -la').toString();
    output += `\nFiles in .next/standalone:\n`;
    output += execSync('ls -la .next/standalone/ 2>&1').toString();
    output += `\nFiles in .next/standalone/db:\n`;
    output += execSync('ls -la .next/standalone/db/ 2>&1').toString();
  } catch(e) {
    output += `Error: ${e.message}\n`;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(output);
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Debug server on ${process.env.PORT || 3000}`);
});
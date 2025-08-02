const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.wasm': 'application/wasm',
    '.json': 'application/json'
};

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    console.log(`${req.method} ${pathname}`);
    
    // Serve WASM file for any route ending with .wasm
    if (pathname.endsWith('.wasm')) {
        serveFile(path.join(__dirname, 'build', 'counter.wasm'), res);
        return;
    }
    
    // Serve static files from public directory
    if (pathname.startsWith('/public/')) {
        const filePath = path.join(__dirname, pathname);
        serveFile(filePath, res);
        return;
    }
    
    // Serve JavaScript files
    if (pathname.endsWith('.js')) {
        const filePath = path.join(__dirname, 'public', path.basename(pathname));
        serveFile(filePath, res);
        return;
    }
    
    // For all other routes, serve the main HTML file (SPA routing)
    if (pathname === '/' || pathname === '/counter' || pathname === '/test' || !path.extname(pathname)) {
        serveFile(path.join(__dirname, 'public', 'index.html'), res);
        return;
    }
    
    // 404 for everything else
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Routes:');
    console.log('  / - Main counter widget');
    console.log('  /counter - Counter widget');
    console.log('  /test - Test route');
    console.log('  *.wasm - WASM files served from any route');
});
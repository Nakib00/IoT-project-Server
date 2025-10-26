require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const os = require('os');                        
const app = require('./src/app');
const { PORT, WS_ENABLED } = require('./src/config/env');

function getLocalWsURLs(port) {
  const nets = os.networkInterfaces();
  const urls = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Pick IPv4, non-internal (LAN) addresses
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`ws://${net.address}:${port}`);
      }
    }
  }
  // Always include localhost as a fallback
  urls.push(`ws://127.0.0.1:${port}`);
  return urls;
}

const server = http.createServer(app);

// Optional WebSocket server
let wss = null;
if (WS_ENABLED) {
  wss = new WebSocket.Server({ server /*, path: '/ws'*/ });  // keep default path
  app.set('wss', wss);
  const UserModel = require('./src/models/userModel');

  wss.on('connection', (ws) => {
    console.log('WS client connected');

    ws.on('message', (msg) => {
      try {
        const incomingData = JSON.parse(msg);

        // authenticate device
        if (incomingData.token && incomingData.action === 'auth') {
          if (UserModel.findProjectByToken(incomingData.token)) {
            ws.isAuthenticated = true;
            ws.token = incomingData.token;
            ws.send(JSON.stringify({ status: 'authenticated' }));
            console.log(`WS device authenticated: ${ws.token.substring(0, 8)}...`);
          } else {
            ws.send(JSON.stringify({ status: 'authentication failed' }));
            ws.terminate();
          }
          return;
        }

        // receive device updates
        if (ws.isAuthenticated && incomingData.action === 'device_update') {
          const payload = incomingData.payload || {};
          if (payload.sensors) {
            const ok = UserModel.addDataToSensor(ws.token, payload.sensors);
            if (ok) console.log(`Saved sensor data for project: ${ws.token.substring(0, 8)}...`);
          }
          if (payload.buttons) {
            console.log(`Button state for ${ws.token.substring(0, 8)}...`, payload.buttons);
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => console.log('WS client disconnected'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server up on http://localhost:${PORT}`);
  if (WS_ENABLED) {
    console.log('WebSocket server enabled');
    const urls = getLocalWsURLs(PORT);
    console.log('Use one of these WS URLs on your ESP:');
    urls.forEach((u) => console.log(`  • ${u}`));
    // If you later set a dedicated WS path, e.g. path:'/ws', append '/ws' to each printed URL.
  }
});

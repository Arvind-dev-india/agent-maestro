#!/usr/bin/env node
// health-check.js - Docker health check script

const http = require('http');
const { exec } = require('child_process');

async function checkDemoSite() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function checkTailscale() {
  return new Promise((resolve) => {
    exec('tailscale status --json 2>/dev/null', (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      
      try {
        const status = JSON.parse(stdout);
        resolve(status.BackendState === 'Running');
      } catch {
        resolve(false);
      }
    });
  });
}

async function main() {
  console.log('Health check starting...');
  
  const [demoSiteOk, tailscaleOk] = await Promise.all([
    checkDemoSite(),
    checkTailscale()
  ]);
  
  console.log(`Demo site: ${demoSiteOk ? 'OK' : 'FAIL'}`);
  console.log(`Tailscale: ${tailscaleOk ? 'OK' : 'FAIL'}`);
  
  // Health check passes if demo site is running
  // Tailscale is optional (might be disabled)
  if (demoSiteOk) {
    console.log('Health check: PASS');
    process.exit(0);
  } else {
    console.log('Health check: FAIL');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Health check error:', error);
  process.exit(1);
});
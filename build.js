#!/usr/bin/env node

/**
 * Build script to inject environment variables into admin.js
 * This replaces placeholders with actual values from Netlify environment variables
 */

const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, 'js', 'admin.js');

// Read admin.js
let adminJs = fs.readFileSync(adminJsPath, 'utf8');

// Replace API key placeholder with environment variable
const apiKey = process.env.ADMIN_API_KEY || '';
if (!apiKey) {
    console.error('ERROR: ADMIN_API_KEY environment variable not set!');
    process.exit(1);
}

adminJs = adminJs.replace('__ADMIN_API_KEY__', apiKey);

// Write back to file
fs.writeFileSync(adminJsPath, adminJs, 'utf8');

console.log('✓ Build complete: API key injected into admin.js');

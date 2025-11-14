// shiprocketService.js
require('dotenv').config();

const BASE = process.env.SHIPROCKET_API_BASE || "https://apiv2.shiprocket.in/v1/external";
const EMAIL = process.env.SHIPROCKET_API_EMAIL;
const PASSWORD = process.env.SHIPROCKET_API_PASSWORD;

// Simple in-memory token cache
let tokenCache = { token: null, expiresAt: 0 };

async function loginAndCacheToken() {
  const now = Date.now();

  // Use cached token if valid
  if (tokenCache.token && tokenCache.expiresAt > now + 5000) {
    return tokenCache.token;
  }

  const url = `${BASE}/auth/login`;
  const body = JSON.stringify({ email: EMAIL, password: PASSWORD });

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Login failed');

    const token = data.token || data?.data?.token;
    if (!token) throw new Error("No token returned from Shiprocket");

    // Cache for 9 days
    tokenCache.token = token;
    tokenCache.expiresAt = now + 9 * 24 * 60 * 60 * 1000;

    console.log(" Shiprocket login successful, token cached.");
    return token;
  } catch (error) {
    console.error(" Shiprocket login failed:", error.message);
    throw new Error("Shiprocket authentication failed");
  }
}

async function authorizedRequest(method, endpoint, data = null) {
  const token = await loginAndCacheToken();
  const url = `${BASE}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (data) options.body = JSON.stringify(data);

  const resp = await fetch(url, options);
  const respData = await resp.json();

  if (!resp.ok) {
    console.error(` Shiprocket ${method.toUpperCase()} ${endpoint} failed:`, respData);
    throw new Error(respData.message || 'Shiprocket API error');
  }

  return respData;
}

// 🧾 Create order (Adhoc)
async function createAdhocOrder(orderPayload) {
  return authorizedRequest("POST", "/orders/create/adhoc", orderPayload);
}

//  Get courier rates
async function getRates(rateReq) {
  return authorizedRequest("POST", "/courier/serviceability/", rateReq);
}

//  Print shipping label
async function printLabel(orderId) {
  return authorizedRequest("GET", `/orders/print/${orderId}`);
}

// 🚚Track shipment by AWB
async function trackByAwb(awb) {
  return authorizedRequest("GET", `/courier/track/awb/${awb}`);
}

//  Track shipment by Shiprocket order/channel ID
async function trackByOrderId(channelOrderId) {
  return authorizedRequest("GET", `/courier/track?order_id=${channelOrderId}`);
}


module.exports = {
  loginAndCacheToken,
  createAdhocOrder,
  getRates,
  printLabel,
  trackByAwb,
   trackByOrderId,
};

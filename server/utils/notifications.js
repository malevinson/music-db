// Notification utility for sending alerts
// Supports: Email (via Nodemailer), Slack, Discord, or custom webhooks

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL; // Email to receive notifications
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const CUSTOM_WEBHOOK_URL = process.env.CUSTOM_WEBHOOK_URL;

// Helper function to extract IP address from Express request
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'Unknown';
}

// Helper function to get location from IP address (using ip-api.com free service)
async function getLocationFromIp(ip) {
  // Skip for localhost/private IPs
  if (!ip || ip === 'Unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { ip, location: 'Local/Private IP' };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        ip,
        location: `${data.city || ''}, ${data.regionName || ''}, ${data.country || ''}`.replace(/^,\s*|,\s*$/g, '').trim() || 'Unknown',
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        coordinates: data.lat && data.lon ? `${data.lat}, ${data.lon}` : null,
        isp: data.isp || 'Unknown',
      };
    }
  } catch (error) {
    console.error('Error fetching location from IP:', error);
  }
  
  return { ip, location: 'Unable to determine' };
}

// Send notification via email (requires email service setup)
async function sendEmailNotification(subject, message) {
  if (!NOTIFICATION_EMAIL) {
    return;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    
    const sendMailPromise = transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: NOTIFICATION_EMAIL,
      subject: subject,
      text: message,
      html: `<pre style="font-family: monospace; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</pre>`,
    });
    
    const sendMailTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
    );
    
    await Promise.race([sendMailPromise, sendMailTimeout]);
  } catch (error) {
    console.error('Error sending email notification:', error.message);
  }
}

// Send notification via Slack webhook
async function sendSlackNotification(message) {
  if (!SLACK_WEBHOOK_URL) {
    return;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      console.error('Slack notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

// Send notification via Discord webhook
async function sendDiscordNotification(message) {
  if (!DISCORD_WEBHOOK_URL) {
    return;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!response.ok) {
      console.error('Discord notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

// Send notification via custom webhook
async function sendWebhookNotification(data) {
  if (!CUSTOM_WEBHOOK_URL) {
    return;
  }

  try {
    const response = await fetch(CUSTOM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Webhook notification failed:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending webhook notification:', error);
  }
}

// Main notification function - sends to all configured channels
export async function sendNotification(subject, message, data = {}) {
  const fullMessage = `${subject}\n\n${message}`;
  
  await Promise.allSettled([
    sendEmailNotification(subject, message),
    sendSlackNotification(fullMessage),
    sendDiscordNotification(fullMessage),
    sendWebhookNotification({ subject, message, ...data }),
  ]);
}

// Specific notification helpers
export async function notifyNewUser(userEmail, ipInfo = null) {
  let locationText = '';
  if (ipInfo) {
    locationText = `\nIP Address: ${ipInfo.ip}\nLocation: ${ipInfo.location}`;
    if (ipInfo.country && ipInfo.country !== 'Unknown') {
      locationText += `\nCountry: ${ipInfo.country}`;
    }
    if (ipInfo.city && ipInfo.city !== 'Unknown') {
      locationText += `\nCity: ${ipInfo.city}`;
    }
    if (ipInfo.isp && ipInfo.isp !== 'Unknown') {
      locationText += `\nISP: ${ipInfo.isp}`;
    }
  }
  
  await sendNotification(
    '🎉 New User Registered',
    `A new user has registered:\nEmail: ${userEmail}${locationText}\nTime: ${new Date().toISOString()}`,
    { type: 'new_user', email: userEmail, ...(ipInfo || {}) }
  );
}

export async function notifyDemoAccountChange(action, details, ipInfo = null) {
  let locationText = '';
  if (ipInfo) {
    locationText = `\nIP Address: ${ipInfo.ip}\nLocation: ${ipInfo.location}`;
    if (ipInfo.country && ipInfo.country !== 'Unknown') {
      locationText += `\nCountry: ${ipInfo.country}`;
    }
    if (ipInfo.city && ipInfo.city !== 'Unknown') {
      locationText += `\nCity: ${ipInfo.city}`;
    }
    if (ipInfo.isp && ipInfo.isp !== 'Unknown') {
      locationText += `\nISP: ${ipInfo.isp}`;
    }
  }
  
  await sendNotification(
    `🔔 Demo Account Change: ${action}`,
    `The demo@test.com account was modified:\nAction: ${action}\nDetails: ${JSON.stringify(details, null, 2)}${locationText}\nTime: ${new Date().toISOString()}`,
    { type: 'demo_account_change', action, ...details, ...(ipInfo || {}) }
  );
}

// Helper function to get IP info from request (extracts IP and fetches location)
export async function getIpInfo(req) {
  const ip = getClientIp(req);
  return await getLocationFromIp(ip);
}


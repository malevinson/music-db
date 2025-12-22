# PlaylistQ

A music playlist management app built with React and Express, deployed on Netlify with MongoDB Atlas.

## Quick Start - Local Development

### Option 1: Two Terminals (For Best Debugging and Hot Reloading)

**Terminal 1** - React dev server:
```bash
npm run dev-frontend
# OR
cd react-ui && NODE_OPTIONS=--openssl-legacy-provider npm start
```

**Terminal 2** - Netlify dev server (after React is running):
```bash
npm run dev-netlify-proxy
# OR
netlify dev --offline
```

Access your app at: **http://localhost:8888**


### Optlon 2: Single Command (Hard to Debug and No Hot Reloading)

```bash
npm run dev-netlify-with-react
```

This starts both the React dev server and Netlify dev server. Access your app at: **http://localhost:8888**

### Option 3: Traditional Local Server (Without Netlify Functions)

**Terminal 1** - Express server:
```bash
npm run dev-local
```

**Terminal 2** - React dev server:
```bash
cd react-ui && npm start
```

**Note:** For this option, you'll need to update `react-ui/package.json` proxy from `http://localhost:8888` to `http://localhost:8340`

## Environment Variables

### Local Development

Create a `.env` file in the root directory:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

# Email Notifications (Optional)
NOTIFICATION_EMAIL=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Netlify Deployment

Set these in the Netlify Dashboard under Site Settings > Environment Variables:
- `SPOTIFY_CLIENT_ID` - Your Spotify API client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify API client secret
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens

### Email Notifications (Optional)

To receive email notifications for new user registrations and demo account changes:
- `NOTIFICATION_EMAIL` - Email address to receive notifications
- `SMTP_HOST` - SMTP server hostname (for Gmail: `smtp.gmail.com`)
- `SMTP_PORT` - SMTP port (for Gmail: `587`)
- `SMTP_USER` - Your email address for SMTP authentication
- `SMTP_PASS` - Your email password or app password (for Gmail, use an App Password)
- `SMTP_FROM` - (Optional) From address, defaults to SMTP_USER

**Gmail Setup:**
1. Enable 2-Step Verification on your Google account
2. Go to Google Account > Security > App Passwords
3. Generate an App Password for "Mail"
4. Use that App Password as `SMTP_PASS` (not your regular Gmail password)

## Available Scripts

- `npm run dev-netlify-with-frontend` - Start both React and Netlify dev servers (recommended)
- `npm run dev-frontend` - Start React dev server only
- `npm run dev-netlify-proxy` - Start Netlify dev server (proxies to React on port 3000)
- `npm run dev-local` - Start Express server locally (port 8340)
- `npm run watch-css` - Watch and compile SCSS files
- `npm run build` - Build React app for production

## Tech Stack

- **Frontend:** React 16.2.0
- **Backend:** Express.js with Netlify Functions
- **Database:** MongoDB Atlas
- **Deployment:** Netlify
- **Authentication:** JWT

## Notes

- Spotify API credentials must be set in environment variables (see Environment Variables section)
- Desktop notifications require browser permission (Chrome recommended)
- The app uses MongoDB Atlas for production and can use local MongoDB for development

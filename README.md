# Music Dashboard

A music playlist management app built with React and Express, deployed on Netlify with MongoDB Atlas.

## Quick Start - Local Development

### Option 1: Single Command (Recommended)

```bash
npm run dev-netlify-with-react
```

This starts both the React dev server and Netlify dev server. Access your app at: **http://localhost:8888**

### Option 2: Two Terminals (For Better Debugging)

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
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Netlify Deployment

Set these in the Netlify Dashboard under Site Settings > Environment Variables:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Available Scripts

- `npm run dev-netlify-with-react` - Start both React and Netlify dev servers (recommended)
- `npm run dev-react` - Start React dev server only
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

- Spotify API credentials are hardcoded in `server/index.js` (no API keys needed for development)
- Desktop notifications require browser permission (Chrome recommended)
- The app uses MongoDB Atlas for production and can use local MongoDB for development

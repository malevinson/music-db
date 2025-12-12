import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import chalk from 'chalk';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import SpotifyWebApi from 'spotify-web-api-node';
import fs from 'fs';

import Artist from '../Artist.js';
import authRoutes from './routes/auth.js';
import { authenticate } from './middleware/auth.js';

const __dirname = path.resolve();
const DB_NAME = 'musicDb';
const STATIC_PATH = path.resolve(__dirname, './react-ui/build');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

let tokenExpirationTime = null;
let tokenRefreshPromise = null;

async function ensureValidToken() {
  if (tokenExpirationTime && Date.now() < tokenExpirationTime - 5 * 60 * 1000) {
    return;
  }

  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = spotifyApi.clientCredentialsGrant()
    .then((data) => {
      const expiresIn = data.body['expires_in'];
      const accessToken = data.body['access_token'];
      tokenExpirationTime = Date.now() + (expiresIn - 300) * 1000;
      spotifyApi.setAccessToken(accessToken);
      tokenRefreshPromise = null;
      return accessToken;
    })
    .catch((err) => {
      console.error('Error obtaining Spotify access token:', err);
      tokenRefreshPromise = null;
      throw err;
    });

  return tokenRefreshPromise;
}

function startTokenRefreshInterval() {
  setInterval(async () => {
    try {
      await ensureValidToken();
    } catch (err) {
      console.error('Error during auto-refresh of Spotify token:', err);
    }
  }, 50 * 60 * 1000);
}

ensureValidToken()
  .then(() => startTokenRefreshInterval())
  .catch((err) => console.error('Failed to obtain initial Spotify token:', err));

async function getArtistImage(artistQuery) {
  await ensureValidToken();
  
  return new Promise((resolve, reject) => {
    spotifyApi.searchArtists(artistQuery).then(
      (data) => {
        if (data.body?.artists?.items?.[0]?.images?.[2]?.url) {
          resolve(data.body.artists.items[0].images[2].url);
        } else {
          reject('Invalid artist or could not find artist image');
        }
      },
      (err) => {
        console.error('Spotify API error:', err);
        reject(err);
      }
    );
  });
}

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

let mongoUri = process.env.MONGODB_URI || 'mongodb+srv://malevinsonAtlasDB:H7tm55eRGRpLHyn9@playlistq.p5uhju3.mongodb.net/musicDb?retryWrites=true&w=majority';

if (!mongoUri.includes('/' + DB_NAME) && !mongoUri.includes('/?')) {
  if (mongoUri.includes('?')) {
    mongoUri = mongoUri.replace('?', `/${DB_NAME}?`);
  } else {
    mongoUri = mongoUri + `/${DB_NAME}`;
  }
}

if (!mongoUri) {
  console.error(chalk.red('FATAL ERROR: No database connection configured.'));
  console.error(chalk.red('Please set MONGODB_URI environment variable.'));
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 1,
  minPoolSize: 0,
  retryWrites: true,
  w: 'majority',
})
  .then(() => console.log(chalk.green('MongoDB connection successful!')))
  .catch(err => {
    console.error(chalk.red('MongoDB connection error:'), err.message);
    console.error(chalk.red('Check your MONGODB_URI environment variable.'));
  });

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

if (STATIC_PATH && fs.existsSync(STATIC_PATH)) {
  app.use(express.static(STATIC_PATH));
}

const router = express.Router();

router.use('/auth', authRoutes);

router.route('/artists')
  .post(authenticate, async (req, res) => {
    try {
      const artist = new Artist({
        name: req.body.name,
        rating: req.body.rating || 100,
        userId: req.user._id,
      });

      try {
        const image = await getArtistImage(req.body.name);
        artist.image = image;
      } catch (err) {
        console.log('Could not fetch artist image:', err);
      }

      await artist.save();
      res.json({ artist });
    } catch (err) {
      res.status(500).json({ error: 'Error creating artist.' });
    }
  })
  .get(authenticate, async (req, res) => {
    try {
      const artists = await Artist.find({ userId: req.user._id });
      res.json(artists);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching artists.' });
    }
  });

router.route('/artist/:artist_id')
  .get(authenticate, async (req, res) => {
    try {
      const artist = await Artist.findOne({ 
        _id: req.params.artist_id, 
        userId: req.user._id 
      });
      
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found or access denied.' });
      }
      
      res.json(artist);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching artist.' });
    }
  })
  .put(authenticate, async (req, res) => {
    try {
      const artist = await Artist.findOne({ 
        _id: req.params.artist_id, 
        userId: req.user._id 
      });
      
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found or access denied.' });
      }

      artist.name = req.body.name;
      artist.rating = req.body.rating;
      artist.pinned = req.body.pinned;
      artist.pinnedMeta.artist = req.body.pinnedMeta?.artist;
      artist.pinnedMeta.radio = req.body.pinnedMeta?.radio;
      artist.pinnedMeta.album = req.body.pinnedMeta?.album;

      await artist.save();
      res.json({ message: 'Artist updated!' });
    } catch (err) {
      res.status(500).json({ error: 'Error updating artist.' });
    }
  })
  .delete(authenticate, async (req, res) => {
    try {
      const result = await Artist.deleteOne({
        _id: req.params.artist_id,
        userId: req.user._id,
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Artist not found or access denied.' });
      }
      
      res.json({ _id: req.params.artist_id });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting artist.' });
    }
  });

app.use('/api', router);

app.get('/api', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send('{"message":"Hello from the custom server!"}');
});

if (STATIC_PATH && fs.existsSync(STATIC_PATH)) {
  app.get('*', (req, res) => {
    const indexFile = path.resolve(STATIC_PATH, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(500).send('React build not found.');
    }
  });
}

export default app;

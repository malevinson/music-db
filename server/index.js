const express = require('express');
const path = require('path');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const bodyParser = require('body-parser');
const morgan = require('morgan');
// const mongoose = require('mongoose');
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const MongoClient = require("mongodb").MongoClient; 

const PORT = process.env.PORT || 5000;

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    //   redirectUri : 'http://www.example.com/callback'
});

spotifyApi.clientCredentialsGrant().then(
    function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);
        spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
        console.log('Something went wrong when retrieving an access token', err);
    },
);

function getArtistImage(artistQuery) {
    return new Promise(function(resolve, reject) {
        spotifyApi.refreshAccessToken().then(
            function(data) {
                console.log('The access token has been refreshed!');
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(data.body['access_token']);
            },
            function(err) {
                console.log('Could not refresh access token', err);
            },
        );
        spotifyApi.searchArtists(artistQuery).then(
            function(data) {
                if (
                    data.body &&
                    data.body.artists &&
                    data.body.artists.items &&
                    data.body.artists.items[0] &&
                    data.body.artists.items[0].images
                ) {
                    const img = data.body.artists.items[0].images[2].url;
                    resolve(img);
                } else {
                    reject('Invalid artist or could not find artist image');
                }
            },
            function(err) {
                console.error(err);
                reject(err);
            },
        );
    });
}

// Multi-process to utilize all CPU cores.
if (cluster.isMaster) {
    console.error(`Node cluster master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
    });
} else {
    const app = express();

    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.get("/", function(req, res) {  
        res.send("Hello World!");  
    }); 


    // ------DB CONNECTION --------
    const url = app.get('env') === 'production' ? process.env.DATABASE_URL : 'mongodb://localhost:27017/musicDb';

    app.get("/users", function() {  
        MongoClient.connect(url, function(err, db) {  
            if (err) next  
            db  
            .collection("artists")  
            .find()  
            .toArray(function(err, result) {  
                if (err) throw err;  

                res.json(result)  
            });  
        });  
    });

    app.listen(3000,function(){  
        console.log('Express app start on port 3000')  
    });

    // console.log(url)
    // console.log(process)
    // console.log(process.env)
    // console.log(process.env.DATABASE_URL)
    // console.log(app.get('env'))

    // mongoose.connect(url, {
    //     useNewUrlParser: true, 
    //     useUnifiedTopology: true 
    // });

    // const db = mongoose.connection;

    // db.on('error', console.error.bind(console, 'connection error:'));

    // db.once('open', function() {
    //     console.log('DB connection alive');
    // });

    const Artist = require('../Artist.js');

    // Priority serve any static files.
    app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

    // START ROUTER NEW

    const router = express.Router();

    router.use(function(req, res, next) {
        console.log('Something is happening.');
        next();
    });

    router
        .route('/artists')
        // create an artist (accessed at POST http://localhost:8080/api/artists)
        .post(function(req, res) {
            var artist = new Artist();
            const name = req.body.name;
            artist.name = name;

            if (req.body.rating) {
                artist.rating = req.body.rating;
            }
            getArtistImage(name)
                .then(image => {
                    artist.image = image;
                    artist.save(function(err) {
                        // if (err) res.send(err);
                        if (err) res.status(500).json({ error: 'Error saving new artist after getting artist image.' });
                        console.log('artist created:');
                        res.json({ artist });
                    });
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(500).json({ error: err });
                });
        })
        // get all the artist (accessed at GET http://localhost:8080/api/artists)
        .get(function(req, res) {
            Artist.find(function(err, artists) {
                // if (err) res.send(err);
                if (err) res.status(500).json({ error: 'Error fetching all saved artists.' });
                console.log('got all artists');
                res.json(artists);
            });
        });

    // on routes that end in /api/artists/:artist_id
    // ----------------------------------------------------
    router
        .route('/artist/:artist_id')
        // console.log('in put route');

        // get the artist with that id
        .get(function(req, res) {
            Artist.findById(req.params.artist_id, function(err, artist) {
                // if (err) res.send(err);
                if (err) res.status(500).json({ error: 'Could not find artist with the id: ' + req.params.artist_id });
                console.log('got that specific artist');
                res.json(artist);
            });
        })

        // update the artist with this id
        .put(function(req, res) {
            Artist.findById(req.params.artist_id, function(err, artist) {
                if (err) res.status(500).json({ error: err });
                
                // try:
                // {
                //     ...artist,
                //     ...req.body
                // }.save
                // try without thsi first:
                // might need to deconstruct 
                // {name,rating,pinned, pinnedMeta} = req.body
                // {artist,radio,album} = pinnedMeta
                // {
                //     name,
                //     rating,
                //     pinned,
                //     artist,
                //     radio,
                //     album
                // }

                // improve this with es6 shorthand? see above comments
                artist.name = req.body.name;
                artist.rating = req.body.rating;
                artist.pinned = req.body.pinned;
                artist.pinnedMeta.artist = req.body.pinnedMeta.artist
                artist.pinnedMeta.radio = req.body.pinnedMeta.radio
                artist.pinnedMeta.album = req.body.pinnedMeta.album

                artist.save(function(err) {
                    if (err)
                        res.status(500).json({
                            error: 'Could not save updates to the artist with id: ' + req.params.artist_id,
                        });
                    res.json({ message: 'Artist updated!' });
                });
            });
        })

        // delete the artist with this id
        .delete(function(req, res) {
            console.log('in delete');
            Artist.remove(
                {
                    _id: req.params.artist_id,
                },
                function(err, artist) {
                    // if (err) res.send(err);
                    if (err)
                        res.status(500).json({ error: 'Could not delete artist with the id: ' + req.params.artist_id });
                    console.log('artist deleted:');
                    res.json({
                        _id: req.params.artist_id,
                    });
                },
            );
        });

    app.use('/api', router);

    // test route to make sure everything is working (accessed at GET http://localhost:8080/api)

    // Answer API requests.
    app.get('/api', function(req, res) {
        res.set('Content-Type', 'application/json');
        res.send('{"message":"Hello from the custom server!"}');
    });

    // All remaining requests return the React app, so it can handle routing.
    app.get('*', function(request, response) {
        response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
    });

    app.listen(PORT, function() {
        console.error(`Node cluster worker ${process.pid}: listening on port ${PORT}`);
    });
}

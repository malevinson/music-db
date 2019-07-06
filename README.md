# music dashboard

## run
mongod,
cd react-ui && npm start,
npm run watch-css,
npm run dev (or see below to update local env api keys)


To fix mongod already running error:
`sudo lsof -iTCP -sTCP:LISTEN -n -P`
Search for mongod COMMAND and its PID and type,
`sudo kill <mongo_command_pid>`


## new api keys
### spotify developer dashboard (https://developer.spotify.com/dashboard/applications)
### CLIENT_ID='id' CLIENT_SECRET='secret' NODE_ENV=development node server

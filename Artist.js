const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const artistSchema = new Schema({
    name: String,
    rating: { type: Number, default: 100 },
    image: String,
    pinned: false
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;

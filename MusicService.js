const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const musicServiceSchema = new Schema({
    // name: String,
    // rating: { type: Number, default: 100 },
    // image: String,
    selections: { type: Array, default: ['googleMusic'] },
    // createdAt: { type: Date, default: Date.now },
    // pinned: false,
    // pinnedMeta: {
    //     artist: { type: Boolean, default: true },
    //     radio: { type: Boolean, default: false },
    //     album: { type: Boolean, default: false },
    //     pandora: { type: Boolean, default: false },
    //     spotify: { type: Boolean, default: false },
    //     googleMusic: { type: Boolean, default: false },
    //     input: { type: String, default: '' },
    // },
});

const MusicService = mongoose.model('MusicService', musicServiceSchema);

module.exports = MusicService;

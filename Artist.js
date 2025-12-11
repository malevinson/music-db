import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const artistSchema = new Schema({
  name: String,
  rating: { type: Number, default: 100 },
  image: String,
  createdAt: { type: Date, default: Date.now },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pinned: false,
  pinnedMeta: {
    artist: { type: Boolean, default: true },
    radio: { type: Boolean, default: false },
    album: { type: Boolean, default: false },
    pandora: { type: Boolean, default: false },
    spotify: { type: Boolean, default: false },
    googleMusic: { type: Boolean, default: false },
    input: { type: String, default: '' },
  },
});

const Artist = mongoose.model('Artist', artistSchema);

// module.exports = Artist;
export default Artist;

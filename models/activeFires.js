const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activeFireSchema = new Schema({

	channelId: { type: String, required: true, unique: true },
	ownerId: { type: String, required: true, unique: false },
	defaultNaming: { type: Boolean, default: true, unique: false },

}, { timestamps: true });

const Fire = mongoose.model('fire', activeFireSchema);
module.exports = Fire;
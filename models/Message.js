const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	message: {
		type: String,
		required: true
	},
	time: {
		type: String,
		required: true
	},
});

const Message = mongoose.model('Message', UserSchema);

module.exports = Message;
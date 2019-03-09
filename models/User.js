const mongoose = require("mongoose");

module.exports = mongoose.model("User", {
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	email: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	status: {
		type: String,
		enum: [ "active", "inactive", "disabled", "locked", "expired" ],
		default: "inactive"
	},
	lastConnection: { type: Date, default: Date.now },
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date, default: Date.now }
});
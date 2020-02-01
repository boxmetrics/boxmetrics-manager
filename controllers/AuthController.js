const Joi = require("joi");
const { createToken, hashPassword, verifyPassword } = require("../utils/auth");
const User = require("../models/User");
const { verifyUniqueUser } = require("../utils/validator");

module.exports = {
	async login(req, res) {
		const { email, password } = req.body;
		const schema = Joi.object().keys({
			email: Joi.string()
				.email()
				.required(),
			password: Joi.string()
				.regex(/^[a-zA-Z0-9]{8,16}$/)
				.min(8)
				.required()
		});
		const result = Joi.validate({ email, password }, schema);
		const { value, error } = result;
		const valid = error == null;

		if (!valid) {
			res.json({
				statusCode: 400,
				error: "Bad request",
				message: "Invalid request payload input."
			}).status(400);
			return;
		}

		User.findOne({ email }, (error, user) => {
			if (error) {
				res.status(500).json({
					statusCode: 500,
					error: "Internal error",
					message: error.message
				});
				return;
			}

			if (!user) {
				res.status(401).json({
					statusCode: 401,
					error: "Unauthorized",
					message: "Failed to authenticate token."
				});
				return;
			}

			if (!verifyPassword(password, user.password)) {
				res.status(401).json({
					statusCode: 401,
					error: "Unauthorized",
					message: "Failed to authenticate token."
				});
				return;
			}

			user.lastConnection = Date.now();

			user.save(error => {
				if (error) {
					res.status(500).json({
						statusCode: 500,
						error: "Internal error",
						message: error.message
					});
					return;
				}
			});

			res.status(200).json({
				statusCode: 200,
				data: {
					token: createToken(user),
					userId: user.id_user
				},
				message: ""
			});
		});
	},
	async register(req, res, next) {
		const { email, username, password, admin } = req.body;
		const schema = Joi.object().keys({
			email: Joi.string()
				.email()
				.required(),
			username: Joi.string()
				.alphanum()
				.min(6)
				.max(16)
				.required(),
			password: Joi.string()
				.regex(/^[a-zA-Z0-9]{8,16}$/)
				.min(8)
				.required(),
			admin: Joi.boolean()
		});
		const result = Joi.validate(
			{ email, username, password, admin },
			schema
		);
		const { value, error } = result;
		const valid = error == null;

		if (!valid) {
			res.status(400).json({
				statusCode: 400,
				error: "Bad request",
				message: "Invalid request payload input."
			});
			return;
		}

		const isUniqueUser = await verifyUniqueUser(
			{ email, username },
			res,
			next
		);

		if (isUniqueUser !== true) {
			res.status(400).json({
				statusCode: 400,
				error: "Bad request",
				message: "User already exists."
			});
			return;
		}

		const hash = hashPassword(password);
		const user = new User({
			email,
			username,
			password: hash,
			admin
		});

		user.save(error => {
			if (error) {
				res.status(500).json({
					statusCode: 500,
					error: "Internal error",
					message: error.message
				});
				return;
			}
			res.status(201).json({
				statusCode: 201,
				data: {
					token: createToken(user),
					userId: user.id_user
				},
				message: ""
			});
		});
	}
};

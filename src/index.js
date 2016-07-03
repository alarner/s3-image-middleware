let gm = require('gm');
let AWSS3 = require('aws-sdk').S3;
let Busboy = require('busboy');
let merge = require('lodash.merge');
let store = require('./store');
let Howhap = require('howhap');

module.exports = function(config) {

	config = merge({
		errors: {
			UNKNOWN: {
				message: 'An unknown error occurred: {{message}}',
				status: 500
			},
			IMAGE_RESIZE: {
				message: 'There was an error resizing the image: {{message}}',
				status: 500
			},
			S3_UPLOAD: {
				message: 'There was an error saving the image: {{message}}',
				status: 500
			}
		},
		s3: {
			accessKeyId: '',
			secretAccessKey: '',
			params: {
				Bucket: '',
				ACL: ''
			},
			options: {
				partSize: 10 * 1024 * 1024,
				queueSize: 1
			}
		},
		sizes: []
	}, config);

	return function(req, res, next) {
		let busboy = new Busboy({ headers: req.headers });
		let { accessKeyId, secretAccessKey } = config.s3;
		let s3 = new AWSS3({ accessKeyId, secretAccessKey });

		store(req, config, busboy, gm, s3)
		.then(results => {
			req.s3Image = results;
			next();
		})
		.catch(err => {
			if(!(err instanceof Howhap)) {
				err = new Howhap(config.errors.UNKNOWN, { message: err.toString() });
			}

			res.status(err.status).json({ default: err.toObject() });
		});
	};
};
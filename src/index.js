let gm = require('gm');
let AWSS3 = require('aws-sdk').S3;
let Busboy = require('busboy');
let merge = require('lodash.merge');
let fromUpload = require('./from-upload');
let fromUrl = require('./from-url');
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
		url: {
			key: 'url',
			type: 'body'
		},
		sizes: []
	}, config);

	return function(req, res, next) {
		let { accessKeyId, secretAccessKey } = config.s3;
		let s3 = new AWSS3({ accessKeyId, secretAccessKey });
		let promise = null;

		if(req[config.url.type] && req[config.url.type][config.url.key]) {
			console.log('from-url');
			promise = fromUrl(req, config, gm, s3);
		}
		else {
			console.log('from-upload');
			let busboy = new Busboy({ headers: req.headers });
			promise = fromUpload(req, config, busboy, gm, s3);
		}

		promise.then(results => {
			req.s3Images = results;
			next();
		})
		.catch(err => {
			console.log('caught error');
			if(!(err instanceof Howhap)) {
				err = new Howhap(config.errors.UNKNOWN, { message: err.toString() });
			}

			res.status(err.status).json({ default: err.toObject() });
		});
	};
};
let Pass = require('stream').PassThrough;
let uuid = require('uuid');
let mime = require('mime');
let async = require('async');
let Howhap = require('howhap');

module.exports = function(req, config, busboy, gm, s3) {
	function resizeToS3(size, file, filename, mimetype, width, height) {
		return function(cb) {
			let resized = gm(file, filename);
			if(width && height) {
				resized.resize(width, height);
			}
			resized.stream((err, stdout, stderr) => {
				if(err) {
					return cb(new Howhap(
						config.errors.IMAGE_RESIZE,
						{ message: err.toString(), width, height }
					));
				}
				let params = Object.assign({
					Key: `${size}-${uuid.v4()}.${mime.extension(mimetype)}`,
					Body: stdout,
					ContentType: mimetype
				}, config.s3.params);

				s3.upload(params, config.s3.options, function(err, data) {
					if(err) {
						return cb(new Howhap(
							config.errors.IMAGE_RESIZE,
							{ message: err.toString(), width, height }
						));
					}
					cb(null, {size: size, value: data.Location});
				});
			});
		};
	}

	return new Promise((resolve, reject) => {
		busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
			let resizeFunctions = config.sizes.map(size => {
				let pass = new Pass();
				file.pipe(pass);
				return resizeToS3(size.name, pass, filename, mimetype, size.width, size.height);
			});

			async.parallel(resizeFunctions, (err, results) => {
				if(err) {
					return reject(err);
				}
				resolve({
					filename,
					images: results
				});
			});
		});

		req.pipe(busboy);
	});
};
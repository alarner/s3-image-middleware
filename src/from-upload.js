let Pass = require('stream').PassThrough;
let async = require('async');
let resizeToS3 = require('./resize-to-s3');

module.exports = function(req, config, busboy, gm, s3) {
    return new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            let resizeFunctions = config.sizes.map(size => {
                let pass = new Pass();
                file.pipe(pass);
                return (cb) => {
                    resizeToS3(
                        gm,
                        config,
                        s3,
                        size.name,
                        pass,
                        filename,
                        mimetype,
                        size.width,
                        size.height
                    )
                    .then((data) => cb(null, data))
                    .catch((err) => cb(err));
                };
            });

            async.parallel(resizeFunctions, (err, images) => {
                if(err) {
                    return reject(err);
                }
                const sizes = {};
                for(const image of images) {
                    sizes[image.size.name] = {
                        width: image.size.width,
                        height: image.size.height,
                        location: image.location
                    };
                }
                return Promise.resolve({ filename, sizes });
            });
        });

        req.pipe(busboy);
    });
};
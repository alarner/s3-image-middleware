let uuid = require('uuid');
let mime = require('mime');
let Howhap = require('howhap');

module.exports = function(gm, config, s3, size, file, filename, mimetype, width, height) {
    return new Promise((resolve, reject) => {
        let resized = gm(file, filename);
        if(width && height) {
            resized.resize(width, height);
        }
        resized.stream((err, stdout, stderr) => {
            if(err) {
                return reject(new Howhap(
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
                    return reject(new Howhap(
                        config.errors.IMAGE_RESIZE,
                        { message: err.toString(), width, height }
                    ));
                }
                resolve({
                    size: {
                        name: size,
                        width,
                        height
                    },
                    location: data.Location
                });
            });
        });
    });
};
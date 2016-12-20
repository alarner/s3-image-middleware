let Pass = require('stream').PassThrough;
let request = require('request');
let resizeToS3 = require('./resize-to-s3');
let path = require('path');
let mime = require('mime');

module.exports = function(req, config, gm, s3) {
    let url = req[config.url.type][config.url.key];
    let filename = path.basename(url);
    let mimetype = mime.lookup(url);
    let req2 = request(url);

    let resizePromises = config.sizes.map(size => {
        let pass = new Pass();
        req2.pipe(pass);
        return resizeToS3(
            gm,
            config,
            s3,
            size.name,
            pass,
            filename,
            mimetype,
            size.width,
            size.height
        );
    });

    return Promise.all(resizePromises).then((images) => {
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
};
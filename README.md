# s3 image middleware

Express middleware to designed to make streaming image uploads to s3 easy. This module has the following functionality:

1. Streaming file uploads or remote file urls to s3.
1. Resize images on the fly, storing multiple images sizes at once.
1. Customize JSON error messages.

## Example

```js
let config = {
	s3: {
		accessKeyId: 'access key id goes here',
		secretAccessKey: 'secret access key goes here',
		params: {
			Bucket: 'my-bucket',
			ACL: 'public-read'
		},
		options: {
			partSize: 10 * 1024 * 1024,
			queueSize: 1
		}
	},
	url: {
		key: 'picture',
		type: 'body'
	},
	sizes: [
		{ name: 'original', width: null, height: null },
		{ name: 'medium', width: 1020, height: 760 }
	]
};

let s3ImageMiddleware = require('s3-image-middleware')(imageConfig);

router.post('/image', s3ImageMiddleware, function(req, res, next) {
	console.log(req.s3Images);
	// {
	// 	filename: 'profile.jpg',
	// 	sizes: {
	// 		original: { width: null, height: null, location: '... image url ...' },
	// 		medium: { width: 1020, height: 760, location: '... image url ...' },
	// 	}
	// }
	res.json(req.s3Images);
});
```

## Options

### errors

#### errors.UNKNOWN.message

> type: string

> default: An unknown error occurred: {{message}}

The error to display if an unexpected error occurrs.

#### errors.UNKNOWN.status

> type: integer

> default: 500

The status code to return if an unexpected error occurrs.

#### errors.IMAGE_RESIZE.message

> type: string

> default: There was an error resizing the image: {{message}}

The error to display if there was a problem using graphicsmagick to resize the image.

#### errors.IMAGE_RESIZE.status

> type: integer

> default: 500

The status code to return if there was a problem using graphicsmagick to resize the image.

#### errors.S3_UPLOAD.message

> type: string

> default: There was an error saving the image: {{message}}

The error to display if there was a problem uploading the image to s3.

#### errors.S3_UPLOAD.status

> type: integer

> default: 500

The status code to return if there was a problem uploading the image to s3.

### s3

#### s3.accessKeyId

> type: string

> default: _empty_

Your s3 access key id.

#### s3.secretAccessKey

> type: string

> default: _empty_

Your s3 secret access key.

#### s3.params.Bucket

> type: string

> default: _empty_

The s3 bucket where the iamges should be uploaded

#### s3.params.ACL

> type: string

> default: _empty_

The ACL permissions of uploaded files. Available options [can be found here](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl).

#### s3.options.partSize

> type: integer

> default: 10485760

Specifies what the chunk size (also referred to as the part size) should be for uploads.

#### s3.options.queueSize

> type: integer

> default: 10485760

Specifies the number of s3 tasks that should run concurrently.

### url

#### url.key

> type: string

> default: url

Specifies the key where a url in the request can be found. The middleware will download the file from this url (if provided) and upload it to s3.

#### url.type

> type: string

> default: body

Specifies the request property where the url key can be found. Possible values are body, query and params.

### sizes

#### sizes

> type: array of objects

> default: []

Specifies the size of files that should be uploaded to s3. Each object in the array should have three properties: `name`, `width` and `height`. Name is a label for this particular size so that it can be referenced in the future. Width and height specify the max width and height that images should be scaled to. Images will not be distorted. Instead they will be as large as possible while still fitting within the specified width and height dimensions.

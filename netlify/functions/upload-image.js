const cloudinary = require('cloudinary').v2;

const REQUIRED_ENV_VARS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

exports.handler = async (event, context) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] upload-image invoked: method=${event.httpMethod}`);

    if (event.httpMethod !== 'POST') {
        console.log(`[${requestId}] Method not allowed: ${event.httpMethod}`);
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    const user = context.clientContext && context.clientContext.user;
    if (!user) {
        console.log(`[${requestId}] Authentication failed: no user in context`);
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized - please login' })
        };
    }

    console.log(`[${requestId}] Authenticated user: ${user.email || 'unknown'}`);

    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            console.error(`[${requestId}] Missing environment variable: ${envVar}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: `Server misconfigured: missing ${envVar}` })
            };
        }
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (parseError) {
        console.error(`[${requestId}] JSON parse error:`, parseError.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON payload' })
        };
    }

    const { image, filename } = payload;

    if (!image || typeof image !== 'string') {
        console.error(`[${requestId}] Invalid image: missing or not a string`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Image field is required and must be a base64 string' })
        };
    }

    if (!image.startsWith('data:image/')) {
        console.error(`[${requestId}] Invalid image format: not a data URI`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Image must be a valid base64 data URI (data:image/...)' })
        };
    }

    const base64Size = image.length * 0.75;
    if (base64Size > 10 * 1024 * 1024) {
        console.error(`[${requestId}] Image too large: ${Math.round(base64Size / 1024 / 1024)}MB`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Image exceeds 10MB limit' })
        };
    }

    console.log(`[${requestId}] Uploading image: filename=${filename || 'unknown'}, size=${Math.round(base64Size / 1024)}KB`);

    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: 'fabian-products',
            format: 'webp',
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
            ],
            resource_type: 'image'
        });

        console.log(`[${requestId}] Upload successful: url=${result.secure_url}, publicId=${result.public_id}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                url: result.secure_url,
                publicId: result.public_id
            })
        };

    } catch (cloudinaryError) {
        console.error(`[${requestId}] Cloudinary error:`, {
            message: cloudinaryError.message,
            http_code: cloudinaryError.http_code,
            error: cloudinaryError.error
        });

        if (cloudinaryError.http_code === 401 || cloudinaryError.http_code === 403) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Cloudinary authentication failed - check API credentials' })
            };
        }

        if (cloudinaryError.message && cloudinaryError.message.includes('Invalid image file')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid image file format' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to upload image to Cloudinary',
                error: cloudinaryError.message || 'Unknown error'
            })
        };
    }
};

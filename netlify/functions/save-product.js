const { Octokit } = require('@octokit/rest');

const REQUIRED_ENV_VARS = ['GITHUB_TOKEN', 'GITHUB_REPO', 'ADMIN_API_KEY'];
const VALID_CATEGORIES = ['asilo', 'bimbo', 'bimba', 'cucina', 'tovagliette', 'grembiuli', 'regalo', 'borse', 'decorazioni'];

exports.handler = async (event, context) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] save-product invoked: method=${event.httpMethod}`);

    if (event.httpMethod !== 'POST') {
        console.log(`[${requestId}] Method not allowed: ${event.httpMethod}`);
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    // Simple API key authentication
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        console.log(`[${requestId}] Authentication failed: invalid API key`);
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized - invalid API key' })
        };
    }

    console.log(`[${requestId}] Authenticated successfully`);

    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            console.error(`[${requestId}] Missing environment variable: ${envVar}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: `Server misconfigured: missing ${envVar}` })
            };
        }
    }

    const repoParts = process.env.GITHUB_REPO.split('/');
    if (repoParts.length !== 2 || !repoParts[0] || !repoParts[1]) {
        console.error(`[${requestId}] Invalid GITHUB_REPO format: ${process.env.GITHUB_REPO}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server misconfigured: GITHUB_REPO must be owner/repo' })
        };
    }

    const owner = repoParts[0];
    const repo = repoParts[1];
    const branch = process.env.GITHUB_BRANCH || 'main';

    console.log(`[${requestId}] GitHub config: ${owner}/${repo}@${branch}`);

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    let product;
    try {
        product = JSON.parse(event.body);
    } catch (parseError) {
        console.error(`[${requestId}] JSON parse error:`, parseError.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON payload' })
        };
    }

    if (!product.id || typeof product.id !== 'string' || product.id.trim() === '') {
        console.error(`[${requestId}] Invalid product.id: ${product.id}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Product ID is required and must be a non-empty string' })
        };
    }

    if (!product.name || typeof product.name !== 'string' || product.name.trim().length < 3) {
        console.error(`[${requestId}] Invalid product.name: ${product.name}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Product name is required and must be at least 3 characters' })
        };
    }

    if (!product.price || typeof product.price !== 'string' || !/^\d+\.\d{2}$/.test(product.price)) {
        console.error(`[${requestId}] Invalid product.price: ${product.price}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Price must be in format: 18.00' })
        };
    }

    if (!product.description || typeof product.description !== 'string' || product.description.trim().length < 10) {
        console.error(`[${requestId}] Invalid product.description length: ${product.description?.length}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Description is required and must be at least 10 characters' })
        };
    }

    if (!Array.isArray(product.categories) || product.categories.length === 0) {
        console.error(`[${requestId}] Invalid product.categories: ${JSON.stringify(product.categories)}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'At least one category is required' })
        };
    }

    for (const cat of product.categories) {
        if (!VALID_CATEGORIES.includes(cat)) {
            console.error(`[${requestId}] Invalid category: ${cat}`);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Invalid category: ${cat}. Valid: ${VALID_CATEGORIES.join(', ')}` })
            };
        }
    }

    if (!Array.isArray(product.images) || product.images.length === 0) {
        console.error(`[${requestId}] Invalid product.images: ${JSON.stringify(product.images)}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'At least one image is required' })
        };
    }

    for (const img of product.images) {
        if (typeof img !== 'string' || img.trim() === '') {
            console.error(`[${requestId}] Invalid image URL: ${img}`);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'All image URLs must be non-empty strings' })
            };
        }
    }

    if (typeof product.featured !== 'boolean') {
        console.error(`[${requestId}] Invalid product.featured: ${product.featured}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Featured must be a boolean' })
        };
    }

    console.log(`[${requestId}] Product validation passed: id=${product.id}, name=${product.name}`);

    let fileData;
    try {
        const response = await octokit.repos.getContent({
            owner,
            repo,
            path: 'products.json',
            ref: branch
        });
        fileData = response.data;
        console.log(`[${requestId}] Retrieved products.json: sha=${fileData.sha.substring(0, 7)}`);
    } catch (githubError) {
        console.error(`[${requestId}] GitHub getContent failed:`, {
            status: githubError.status,
            message: githubError.message
        });

        if (githubError.status === 401 || githubError.status === 403) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'GitHub authentication failed - check GITHUB_TOKEN permissions' })
            };
        }

        if (githubError.status === 404) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'products.json not found in repository' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to retrieve products.json from GitHub',
                error: githubError.message
            })
        };
    }

    let productsData;
    try {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        productsData = JSON.parse(content);
    } catch (parseError) {
        console.error(`[${requestId}] products.json parse error:`, parseError.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'products.json is not valid JSON' })
        };
    }

    if (!productsData.products || !Array.isArray(productsData.products)) {
        console.error(`[${requestId}] products.json missing products array`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'products.json does not contain a valid products array' })
        };
    }

    const existingIds = productsData.products.map(p => p.id);
    if (existingIds.includes(product.id)) {
        console.error(`[${requestId}] Duplicate product ID: ${product.id}`);
        return {
            statusCode: 409,
            body: JSON.stringify({ message: `Product with ID ${product.id} already exists` })
        };
    }

    console.log(`[${requestId}] Current products count: ${productsData.products.length}`);

    productsData.products.push(product);

    const newContent = Buffer.from(JSON.stringify(productsData, null, 2)).toString('base64');
    const commitMessage = `Add product: ${product.name} (via admin panel)

Added by: admin
Product ID: ${product.id}`;

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'products.json',
            message: commitMessage,
            content: newContent,
            sha: fileData.sha,
            branch
        });

        console.log(`[${requestId}] Commit successful: productId=${product.id}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Product added successfully',
                productId: product.id
            })
        };

    } catch (commitError) {
        console.error(`[${requestId}] GitHub commit failed:`, {
            status: commitError.status,
            message: commitError.message
        });

        if (commitError.status === 409) {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Conflict: products.json was modified by someone else. Please refresh and try again.' })
            };
        }

        if (commitError.status === 401 || commitError.status === 403) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'GitHub authentication failed - check GITHUB_TOKEN has write permissions' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Failed to commit to GitHub',
                error: commitError.message
            })
        };
    }
};

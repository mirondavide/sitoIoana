const { Octokit } = require('@octokit/rest');

const REQUIRED_ENV_VARS = ['GITHUB_TOKEN', 'GITHUB_REPO', 'ADMIN_API_KEY'];

exports.handler = async (event, context) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] delete-product invoked: method=${event.httpMethod}`);

    if (event.httpMethod !== 'DELETE') {
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

    const productId = payload.id;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        console.error(`[${requestId}] Invalid product ID: ${productId}`);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Product ID is required and must be a non-empty string' })
        };
    }

    console.log(`[${requestId}] Deleting product: id=${productId}`);

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

    // Find product to get name for commit message
    const productIndex = productsData.products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        console.error(`[${requestId}] Product not found: ${productId}`);
        return {
            statusCode: 404,
            body: JSON.stringify({ message: `Product with ID ${productId} not found` })
        };
    }

    const productName = productsData.products[productIndex].name;
    console.log(`[${requestId}] Found product to delete: ${productName}`);

    // Remove product
    productsData.products = productsData.products.filter(p => p.id !== productId);

    console.log(`[${requestId}] Products count after deletion: ${productsData.products.length}`);

    const newContent = Buffer.from(JSON.stringify(productsData, null, 2)).toString('base64');
    const commitMessage = `Delete product: ${productName} (via admin panel)

Deleted by: admin
Product ID: ${productId}`;

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

        console.log(`[${requestId}] Commit successful: deleted productId=${productId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Product deleted successfully',
                productId: productId,
                productName: productName
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

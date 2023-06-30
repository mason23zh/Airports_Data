const removeHeader = (res) => {
    res.removeHeader("Access-Control-Allow-Origin");
    res.removeHeader("X-Frame-Options");
    res.removeHeader("ETag");
    res.removeHeader("Vary");
    res.removeHeader("X-XSS-Protection");
    res.removeHeader("X-Permitted-Cross-Domain-Policies");
    res.removeHeader("X-Download-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("X-DNS-Prefetch-Control");
    res.removeHeader("Origin-Agent-Cluster");
};

module.exports = { removeHeader };

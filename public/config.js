// Configuration for GitHub Pages deployment
window.APP_CONFIG = {
    basePath: window.location.pathname.includes('/puppy/') ? '/puppy' : '',
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
};
var app = {};

function start(callback) {
    init(function() {
        /* On démarre le routeur défini juste avant */
        app.router.start(function() {
            if(typeof callback != 'undefined') {
                callback();
            }
        });
    });
}

function init(callback) {
    /* On instancie notre module router */
    app.router = require('./router');

    if(typeof callback != 'undefined') {
        callback();
    }
}

module.exports = {
    start: start
};
module.exports = {
    verifyJWT: function (res, res, next) {

        if (typeof localStorage === "undefined" || localStorage === null) {
            var LocalStorage = require('node-localstorage').LocalStorage;
            localStorage = new LocalStorage('./scratch');
        }

        console.log(localStorage.getItem('secret_token'));
        return next();
    }
}
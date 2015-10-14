var fs = require("fs")
exports.Logger = {
    log: function(msg) {
        console.log(msg)
    },
    warn: function(msg) {
        console.log("[WARN]" + msg)
    },
    error: function(msg) {
        this.log("[ERROR]" + msg)
    },
    success: function() {
        this.log("[SUCCESS]" + msg)
    },
    data: function(msg) {
        this.log("[DATA]" + msg)
    }
}
var Soundwave = require('./soundwave');

Soundwave.server = function(primus, options) {
    var soundwave = new Soundwave(primus, options);
    
    primus.soundwave = soundwave;
};

Soundwave.client = function(primus, options) {
    // emits soundwave message (cassette) to server
    primus.soundwave = function(recipient, message) {
        var cassette = {
            recipient: recipient,
            message: message
        };
        
        return this.emit('soundwave', cassette);
    };
};

module.exports = Soundwave;

var fuse = require('fusing');

function Soundwave(primus, options) {
    if (!(this instanceof Soundwave)) return new Soundwave(primus, options);

    // options
    this.subscriber = options.soundwave.subscriber;
    this.publisher = options.soundwave.publisher;
    this.server = options.soundwave.server;

    var getSoundwaveId = options.soundwave.getSoundwaveId;

    this.fuse();

    var soundwave = this;

    // delivers message to spark
    soundwave.deliverCassette = function(cassette) {
        var recipient = cassette.recipient;
        
        primus.forEach(function(spark) {
            if (spark.soundwave === recipient.id) {
                spark.emit('soundwave', cassette);
                
                soundwave.emit('deliverCassette', cassette);

                return;
            }
        });
    };

    // subscribes to soundwave messages; tries to emit to sparks
    soundwave.subscriber.on('message', function(channel, message) {
        var cassette = JSON.parse(message);

        soundwave.emit('receiveCassette', cassette);

        // we trust redis; no null checks
        
        soundwave.deliverCassette(cassette);
    });

    primus.on('connection', function(spark) {
        soundwave.emit('connect', spark);
        
        spark.soundwave = getSoundwaveId(spark);
        
        if (!spark.soundwave) return;
        
        // tries to emit message to sparks on this server; otherwise publishes to redis
        spark.on('soundwave', function(cassette) {
            soundwave.emit('acceptCassette', cassette);
            
            // don't trust client input
            
            if (!cassette) return;
            if (!cassette.recipient) return;
            if (!cassette.message) return;
            
            cassette.sender = {
                server: soundwave.server,
                id: spark.soundwave
            };

            var recipient = cassette.recipient;
            
            if (recipient.server == soundwave.server) {
                soundwave.deliverCassette(cassette);
            } else {
                soundwave.publisher.publish(recipient.server, JSON.stringify(cassette));

                soundwave.emit('transmitCassette', cassette);
            }
        });
    });

    soundwave.subscriber.subscribe(soundwave.server);

    // so that initialize can actually be consumed
    process.nextTick(function() { soundwave.emit('initialize'); });
}

fuse(Soundwave, require('eventemitter3'));

module.exports = Soundwave;

const charol = require('charol')
let topics = {
    server: {
        channels: {
            online: null,
            request: null,
            close: null,
        }
    }
}
topics = charol(topics)
module.exports = topics
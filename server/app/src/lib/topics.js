const charol = require('charol')

let topics = {
    server: {
        sessions: {
            online: null
        },
        attendants: {
            online: null,
            request: null,
            quit: null,
            assign: null
        }
    },
    client: {
        attendants: {
            assign: null
        },
        sessions: {
            online: null
        }
    }
}
topics = charol(topics)

 module.exports = topics
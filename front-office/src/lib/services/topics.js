import charol from 'charol'

let topics = {
    chatStation: {
        sessionList: {
            selected: null
        },
        messagePane: {
            send: null
        },
        window: {
            visibility: null
        }
    },
    sessions: {
        updates: null
    },

    
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

 export default topics
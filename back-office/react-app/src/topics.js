import charol from 'charol'

let topics = {
    chatStation: {
        sessionList: {
            selected: null
        }
    },
    sessions: {
        messages: {
            channel: null
        },  
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
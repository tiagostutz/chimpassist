import charol from 'charol'

let topics = {
    chatStation: {
        customerList: {
            selected: null
        }
    },
    customer: {
        messages: {
            channel: null
        },
        sessions: {
            updates: null
        }
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
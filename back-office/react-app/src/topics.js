import charol from 'charol'

let topics = {
    chatStation: {
        costumerList: {
            selected: null
        }
    },
    costumerRadar: {
        messages: {
            channel: null
        },
        status: {
            online: null,
            offline: null,
        },
        updates: {
            global: null        
        }
    },

    
    server: {
        sessions: {
            online: null,
            request: null,
            close: null
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
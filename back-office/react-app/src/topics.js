import charol from 'charol'

let topics = {
    chatStation: {
        sessionList: {
            selected: null
        },
        user: {
            login: null,
            logout: null,
            block: null,
            unblock: null
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
            assign: null,
            control: null
        },
        sessions: {
            online: null
        }
    }
}
topics = charol(topics)

 export default topics
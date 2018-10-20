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
    }
}
topics = charol(topics)

 export default topics
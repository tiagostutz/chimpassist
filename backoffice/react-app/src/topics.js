import charol from 'charol'

let topics = {
    chatList: {
        select: null,
        message: {
            new: null
        }
    },
    costumers: {
        online: null,
        offline: null
    }
}
topics = charol(topics)

 export default topics
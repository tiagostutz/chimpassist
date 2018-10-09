import charol from 'charol'

let topics = {
    chatList: {
        select: null
    },
    costumers: {
        online: null,
        offline: null,
        chats: null
    }
}
topics = charol(topics)

 export default topics
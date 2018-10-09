import { RhelenaPresentationModel, globalState } from 'rhelena';
import moment from 'moment'
import manuh from 'manuh'
import topics from '../topics'

export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();

        this.loggedUser = globalState.loggedUser
        this.costumer = null

        manuh.subscribe(topics.chatList.select._path, "ChatModel", msg => {

            if (this.costumer && this.costumer.id) { //remove subscription from the past "chat data" before assigning new one
                manuh.unsubscribe(`${topics.costumers.chats._path}/${this.costumer.id}`, "ChatModel")
            }
            this.costumer = msg.costumer
            manuh.subscribe(`${topics.costumers.chats._path}/${this.costumer.id}`, "ChatModel", msg => {                
                this.costumer = msg.costumer //refresh =/
            })
        })

    }

    sendMessage(data) {
        this.costumer.lastMessages.push({
            from: this.costumer,
            to: globalState.loggedUser,
            dateTime: moment(new Date()).fromNow(),
            timestamp: new Date(),
            content: data
        })
        manuh.publish(`${topics.costumers.chats._path}/${this.costumer.id}`, { costumer: this.costumer })
    }
}
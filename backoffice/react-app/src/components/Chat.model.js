import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from '../topics'
export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();

        globalState.loggedUser = { id: 1, name: "Rachel"}
        this.loggedUser = globalState.loggedUser
        this.costumer = null

        manuh.subscribe(topics.chatList.select._path, "ChatModel", msg => {
            this.costumer = msg.costumer
        })
    }

    sendMessage() {

    }
}
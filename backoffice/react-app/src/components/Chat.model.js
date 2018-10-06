import { RhelenaPresentationModel, globalState } from 'rhelena';
export default class ChatModel extends RhelenaPresentationModel {
    constructor(costumer) {
        super();

        this.messageText = ""
        this.chatMessages = []
        this.agent = globalState.loggedUser
        this.costumer = costumer
    }

    sendMessage() {

    }
}
import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(chatInfo) {
        super();

        this.costumer = chatInfo.costumer
        this.chatId = `${globalState.loggedUser}-${this.costumer.id}`
        
        this.lastMessage = chatInfo.lastMessage
        this.status = "offline"
        this.active = false

        manuh.subscribe(topics.chatList.select._path, `ChatListItemModel_${this.costumer.id}`, (msg) => {
            this.active = (msg.chatId == this.chatId)
        })
    }

    onSelect() {
        manuh.publish(topics.chatList.select._path, { chatId: this.chatId })
    }
}
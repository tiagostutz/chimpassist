import { RhelenaPresentationModel } from 'rhelena';

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(chatInfo) {
        super();

        this.costumer = chatInfo.costumer
        
        this.lastMessage = chatInfo.lastMessage
        this.status = "offline"
        this.active = false
    }
}
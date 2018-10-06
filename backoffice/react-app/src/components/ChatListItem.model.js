import { RhelenaPresentationModel } from 'rhelena';

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(chatInfo) {
        super();

        this.costumer = chatInfo.costumer
        console.log('this.costumer', this.costumer);
        
        this.lastMessage = chatInfo.lastMessage
        this.status = "offline"
        this.active = false
    }
}
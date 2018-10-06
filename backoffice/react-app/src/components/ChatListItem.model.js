import { RhelenaPresentationModel } from 'rhelena';

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(chat) {
        super();

        this.costumer = chat.costumer
        console.log('this.costumer', this.costumer);
        
        this.messages = chat.messages
        this.status = "offline"
        this.active = false
    }
}
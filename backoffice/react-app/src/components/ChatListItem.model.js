import { RhelenaPresentationModel } from 'rhelena';
import manuh from 'manuh'

import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(costumer) {
        super();

        this.costumer = costumer        
        this.active = false

        manuh.subscribe(topics.chatList.select._path, `ChatListItemModel_${this.costumer.id}`, msg => {
            this.active = (msg.costumer.id === this.costumer.id)
        })
        manuh.subscribe(`${topics.costumers.chats._path}/${this.costumer.id}`, `ChatListItemModel_${this.costumer.id}`, msg => {
            this.costumer = msg.costumer
        })
    }

    onSelect() {        
        manuh.publish(topics.chatList.select._path, { costumer: this.costumer })
    }
}
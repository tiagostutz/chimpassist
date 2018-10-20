import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(costumerId) {
        super();

        this.costumer = globalState.costumers.filter(c => c.id === costumerId)[0]        
        this.active = false

        manuh.subscribe(topics.chatStation.costumerList.selected, `ChatListItemModel_${this.costumer.id}`, msg => {
            this.active = (msg.costumerId === this.costumer.id)
        })
        manuh.subscribe(`${topics.costumerRadar.messages.channel}/${this.costumer.id}`, `ChatListItemModel_${this.costumer.id}`, msg => {
            this.costumer = msg.costumer
        })
    }

    onSelect() {   
        manuh.publish(topics.chatStation.costumerList.selected, { costumerId: this.costumer.id })
    }
}
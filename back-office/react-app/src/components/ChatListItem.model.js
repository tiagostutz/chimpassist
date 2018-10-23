import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(customerId) {
        super();

        this.customer = globalState.customers.filter(c => c.id === customerId)[0]        
        this.active = false

        manuh.subscribe(topics.chatStation.customerList.selected, `ChatListItemModel_${this.customer.id}`, msg => {
            this.active = (msg.customerId === this.customer.id)
        })
        manuh.subscribe(`${topics.customer.messages.channel}/${this.customer.id}`, `ChatListItemModel_${this.customer.id}`, msg => {
            this.customer = msg.customer
        })
    }

    onSelect() {   
        manuh.publish(topics.chatStation.customerList.selected, { customerId: this.customer.id })
    }
}
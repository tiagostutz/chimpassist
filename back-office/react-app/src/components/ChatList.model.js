import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from "manuh"

import topics from '../topics'

export default class ChatListModel extends RhelenaPresentationModel {

    constructor() {
        super();
        
        this.onlineCustomers = globalState.customers.filter(c => c.isOnline)
        this.offlineCustomers = globalState.customers.filter(c => !c.isOnline)
        
        manuh.subscribe(topics.customer.sessions.updates, "ChatListModel", customer => {            
            if (customer.isOnline) {
                this.onlineCustomers.push(customer)
                this.offlineCustomers = this.offlineCustomers.filter(c => c.id !== customer.id)
            }else{
                this.offlineCustomers.push(customer)
                this.onlineCustomers = this.onlineCustomers.filter(c => c.id !== customer.id)
            }
        })        
    }

}
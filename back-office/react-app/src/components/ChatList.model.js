import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from "manuh"

import topics from '../topics'

export default class ChatListModel extends RhelenaPresentationModel {

    constructor() {
        super();

        this.onlineCustomers = globalState.customers.filter(c => c.isOnline)
        this.offlineCustomers = globalState.customers.filter(c => !c.isOnline)

        manuh.subscribe(topics.costumerRadar.updates.global, "ChatListModel", _ => {            
            this.onlineCustomers = globalState.customers.filter(c => c.isOnline)
            this.offlineCustomers = globalState.customers.filter(c => !c.isOnline)
        })
        
    }

}
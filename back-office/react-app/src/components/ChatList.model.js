import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from "manuh"

import topics from '../topics'

export default class ChatListModel extends RhelenaPresentationModel {

    constructor() {
        super();

        this.onlineCostumers = globalState.costumers.filter(c => c.isOnline)
        this.offlineCostumers = globalState.costumers.filter(c => !c.isOnline)

        manuh.subscribe(topics.costumerRadar.updates.global, "ChatListModel", _ => {            
            this.onlineCostumers = globalState.costumers.filter(c => c.isOnline)
            this.offlineCostumers = globalState.costumers.filter(c => !c.isOnline)
        })
        
    }

}
import { RhelenaPresentationModel, globalState } from 'rhelena';
import moment from 'moment'
import manuh from 'manuh'
import topics from '../topics'

export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();
        this.loggedUser = globalState.loggedUser
        this.costumer = null
        this.showCostumerDetails = false
        
        manuh.subscribe(topics.chatStation.costumerList.selected._path, "ChatModel", msg => {      
            if (!this.isStateKept("chatModels", msg.costumerId)) {
                this.keepState("chatModels", msg.costumerId);
                this.initializeAttributes()
            }else{
                this.loadState("chatModels", msg.costumerId);                   
            }

            if (this.costumer && this.costumer.id) { //remove subscription from the past "chat data" before assigning new one
                manuh.unsubscribe(`${topics.costumerRadar.messages.channel._path}/${this.costumer.id}`, "ChatModel")
            }

            this.costumer = globalState.costumers.filter(c => c.id === msg.costumerId)[0]        
            
            manuh.subscribe(`${topics.costumerRadar.messages.channel._path}/${this.costumer.id}`, "ChatModel", msg => {                
                this.costumer = msg.costumer //refresh =/
            })
        })

    }
    initializeAttributes() {
        this.loggedUser = globalState.loggedUser
        this.costumer = null
        this.showCostumerDetails = false
    }

    sendMessage(data) {
        this.costumer.lastMessages.push({
            from: globalState.loggedUser,
            to: this.costumer,
            dateTime: moment(new Date()).fromNow(),
            timestamp: new Date(),
            content: data
        })
        //update costumer to all those listening to changes on it
        manuh.publish(`${topics.costumerRadar.messages.channel._path}/${this.costumer.id}`, { costumer: this.costumer })
    }

    toggleCostumerDetails() {
        this.showCostumerDetails = !this.showCostumerDetails
    }
}
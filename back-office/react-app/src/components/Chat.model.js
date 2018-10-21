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
        
        manuh.subscribe(topics.chatStation.costumerList.selected, "ChatModel", msg => {      

            // check whether this ViewModel was used for this costumerId. If not, initialize and persist the data for this costumer
            // this is done so you don't have to instantiate the Chat Component for each selected costumer, you just load a different model for the same view 
            // you must keep the state because the interaction state for each costumer must be tracked and kept individually. For example, if you open the 
            // details pane for Costumer A but don't open for Costumer B, when you click to chat with Costumer A the details pane must be opened and
            // when you click to chat with Costumer B it must be closed
            // So we have 1 view instance attached to 1 model instance but with many states interchanged
            if (!this.isStateKept("chatModels", msg.costumerId)) {
                this.keepState("chatModels", msg.costumerId);
                this.initializeAttributes()
            }else{
                this.loadState("chatModels", msg.costumerId);                   
            }

            if (this.costumer && this.costumer.id) { //remove subscription from the past "chat data" before assigning new one
                manuh.unsubscribe(`${topics.costumerRadar.messages.channel}/${this.costumer.id}`, "ChatModel")
            }

            this.costumer = globalState.costumers.filter(c => c.id === msg.costumerId)[0]        
            
            manuh.subscribe(`${topics.costumerRadar.messages.channel}/${this.costumer.id}`, "ChatModel", msg => {                
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
        manuh.publish(`${topics.costumerRadar.messages.channel}/${this.costumer.id}`, { costumer: this.costumer })
    }

    toggleCostumerDetails() {
        this.showCostumerDetails = !this.showCostumerDetails
    }
}
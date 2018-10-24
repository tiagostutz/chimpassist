import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import chatServices from '../services/chatServices'
import topics from '../topics'

export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();
        this.loggedUser = globalState.loggedUser
        this.session = null
        this.showCustomerDetails = false
        
        manuh.subscribe(topics.chatStation.sessionList.selected, "ChatModel", msg => {      

            // check whether this ViewModel was used for this customerId. If not, initialize and persist the data for this customer
            // this is done so you don't have to instantiate the Chat Component for each selected customer, you just load a different model for the same view 
            // you must keep the state because the interaction state for each customer must be tracked and kept individually. For example, if you open the 
            // details pane for Customer A but don't open for Customer B, when you click to chat with Customer A the details pane must be opened and
            // when you click to chat with Customer B it must be closed
            // So we have 1 view instance attached to 1 model instance but with many states interchanged
            if (!this.isStateKept("chatModels", msg.sessionTopic)) {
                this.keepState("chatModels", msg.sessionTopic);
                this.initializeAttributes()
            }else{
                this.loadState("chatModels", msg.sessionTopic);                   
            }

            // if (this.session && this.session.sessionTopic) { //remove subscription from the past "chat data" before assigning new one
            //     manuh.unsubscribe(`${topics.customer.messages.channel}/${this.session.sessionTopic}`, "ChatModel")
            // }

            this.session = globalState.sessions.filter(c => c.id === msg.customerId)[0]        
            
            // connect to this user session currentTopic
            chatServices.resolveChatSession(msg, msg => {                
                    this.session = msg //refresh =/
            })
            // manuh.subscribe(`${topics.customer.messages.channel}/${this.customer.id}`, "ChatModel", msg => {                
            //     this.customer = msg.customer //refresh =/
            // })
        })

    }
    initializeAttributes() {
        this.loggedUser = globalState.loggedUser
        this.session = null
        this.showCustomerDetails = false
    }

    sendMessage(data) {
        // this.session.costumer.lastMessages.push({
        //     from: globalState.loggedUser,
        //     to: this.customer,
        //     timestamp: new Date().getTime(),
        //     content: data
        // })
        //update customer to all those listening to changes on it
        chatServices.sendMessage(this.session, {
            from: globalState.loggedUser,
            to: this.customer,
            timestamp: new Date().getTime(),
            content: data
        })
        // manuh.publish(`${topics.sessions.messages.channel}/${this.customer.id}`, { customer: this.customer })
    }

    toggleCustomerDetails() {
        this.showCustomerDetails = !this.showCustomerDetails
    }
}
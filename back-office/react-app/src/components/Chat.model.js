import { RhelenaPresentationModel, globalState } from 'rhelena';
import moment from 'moment'
import manuh from 'manuh'
import topics from '../topics'

export default class ChatModel extends RhelenaPresentationModel {
    constructor() {
        super();
        this.loggedUser = globalState.loggedUser
        this.customer = null
        this.showCustomerDetails = false
        
        manuh.subscribe(topics.chatStation.customerList.selected, "ChatModel", msg => {      

            // check whether this ViewModel was used for this customerId. If not, initialize and persist the data for this customer
            // this is done so you don't have to instantiate the Chat Component for each selected customer, you just load a different model for the same view 
            // you must keep the state because the interaction state for each customer must be tracked and kept individually. For example, if you open the 
            // details pane for Customer A but don't open for Customer B, when you click to chat with Customer A the details pane must be opened and
            // when you click to chat with Customer B it must be closed
            // So we have 1 view instance attached to 1 model instance but with many states interchanged
            if (!this.isStateKept("chatModels", msg.customerId)) {
                this.keepState("chatModels", msg.customerId);
                this.initializeAttributes()
            }else{
                this.loadState("chatModels", msg.customerId);                   
            }

            if (this.customer && this.customer.id) { //remove subscription from the past "chat data" before assigning new one
                manuh.unsubscribe(`${topics.customer.messages.channel}/${this.customer.id}`, "ChatModel")
            }

            this.customer = globalState.customers.filter(c => c.id === msg.customerId)[0]        
            
            manuh.subscribe(`${topics.customer.messages.channel}/${this.customer.id}`, "ChatModel", msg => {                
                this.customer = msg.customer //refresh =/
            })
        })

    }
    initializeAttributes() {
        this.loggedUser = globalState.loggedUser
        this.customer = null
        this.showCustomerDetails = false
    }

    sendMessage(data) {
        this.customer.lastMessages.push({
            from: globalState.loggedUser,
            to: this.customer,
            dateTime: moment(new Date()).fromNow(),
            timestamp: new Date(),
            content: data
        })
        //update customer to all those listening to changes on it
        manuh.publish(`${topics.customer.messages.channel}/${this.customer.id}`, { customer: this.customer })
    }

    toggleCustomerDetails() {
        this.showCustomerDetails = !this.showCustomerDetails
    }
}
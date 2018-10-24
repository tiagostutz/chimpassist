import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from '../topics'
import chatServices from '../services/chatServices'
import attendantTypes from '../attendant-types'

import debugLib from 'debug'
const debug = debugLib('debug-model-chatStation')

export default class ChatStationModel extends RhelenaPresentationModel {
    constructor() {
        super();

        globalState.loggedUser = {
            id: "10",
            email: "john@smiht.com",
            name: "John Smith",
            avatarURL: "https://st2.depositphotos.com/3369547/11899/v/950/depositphotos_118998210-stock-illustration-woman-glasses-female-avatar-person.jpg",
            type: attendantTypes.support.firstLevel
        }

        //initialize customers
        globalState.customers = []

        // update globalState customer list
        manuh.subscribe(topics.customer.sessions.updates, "ChatStation", customer => {            
            let currentCustomerArr = globalState.customers.filter(c => c.id === customer.id)
            if (currentCustomerArr.length === 0) { //new user
                globalState.customers.push(customer)
            }else{
                // replace the customer in the global list with the received one
                globalState.customers = globalState.customers.map(c => c.id === customer.id ? customer : c)
            }
        })
        // -- end of customers setup

        chatServices.startService(globalState.loggedUser, () => {
            debug("Chat Service started from ChatStationModel")
        })
    
    }   
}
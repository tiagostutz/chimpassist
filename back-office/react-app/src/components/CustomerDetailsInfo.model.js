import { RhelenaPresentationModel, globalState } from 'rhelena';

export default class CustomerDetailsInfoModel extends RhelenaPresentationModel {
    constructor(sessionParam) {
        super();

        this.session = sessionParam
        this.customerDetailsContact = null
        this.customerDetailsAdditionalInfo = null
        this.load()
    }

    async load() {
        let resp = await fetch(`${globalState.customerDetailsService}/${this.session.customer.id}/contact`)        
        this.customerDetailsContact = await resp.json()
        resp = await fetch(`${globalState.customerDetailsService}/${this.session.customer.id}/additional`)        
        this.customerDetailsAdditionalInfo = await resp.json()        
    }

}
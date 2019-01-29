import { RhelenaPresentationModel, globalState } from 'rhelena';

export default class CustomerDetailsInfoModel extends RhelenaPresentationModel {
    constructor({session}) {
        super();

        this.session = session        
        this.customerDetailsContact = null
        this.customerDetailsAdditionalInfo = null
        this.load()
    }

    async load() {
        let resp = await fetch(`${globalState.customerDetailsService}/chimpassist/customer/${this.session.customer.id}/contactInfo?attendant=${globalState.loggedUser.id}`)        
        const contactInfoItems = await resp.json()
        this.customerDetailsContact = contactInfoItems.filter(c => c.value)
        resp = await fetch(`${globalState.customerDetailsService}/chimpassist/customer/${this.session.customer.id}/additionalInfo?attendant=${globalState.loggedUser.id}`)        
        const additionalInfoItems = await resp.json()        
        this.customerDetailsAdditionalInfo = additionalInfoItems.filter(a => a.value)
    }

}
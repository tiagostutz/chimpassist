import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import CustomerDetailsModel from './CustomerDetails.model'

export default class CustomerDetails extends Component {

    componentWillMount() {
        attachModelToView(new CustomerDetailsModel(), this)
    }

    render() {
        return (
            <div></div>
        )
    }
}
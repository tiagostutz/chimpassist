import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import CostumerDetailsModel from './CostumerDetails.model'

export default class CostumerDetails extends Component {

    componentWillMount() {
        attachModelToView(new CostumerDetailsModel(), this)
    }

    render() {
        return (
            <div></div>
        )
    }
}
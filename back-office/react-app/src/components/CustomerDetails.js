import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import CustomerDetailsModel from './CustomerDetails.model'
import CustomerDetailsActivity from './CustomerDetailsActivity'
import CustomerDetailsInfo from './CustomerDetailsInfo'

import { withI18n } from "react-i18next";
  
import '../i18n.js'

import "./CustomerDetails.css"

class CustomerDetails extends Component {

    componentWillMount() {
        attachModelToView(new CustomerDetailsModel(this.props.session), this)
    }

    render() {
        if (!this.state.session) {
            return <div></div>
        }

        const { t } = this.props          

        return (
        
            <div>
                <header>
                    <div onClick={() => this.viewModel.selectTab(1)} className={`tab ${this.state.currentTab===1 ? "selected" : ""}`}>{ t("Activity") }</div>
                    <div onClick={() => this.viewModel.selectTab(2)} className={`tab ${this.state.currentTab===2 ? "selected" : ""}`}>{ t("User info") }</div>
                </header>

                { this.state.currentTab===1 && <CustomerDetailsActivity session={this.state.session} /> }

                { this.state.currentTab===2 && <CustomerDetailsInfo session={this.state.session} />}

            </div>

        )
    }
}

export default withI18n()(CustomerDetails)
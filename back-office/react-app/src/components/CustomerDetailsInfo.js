import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import CustomerDetailsInfoModel from './CustomerDetailsInfo.model'
import { withI18n } from "react-i18next";
  
import '../i18n.js'

class CustomerDetailsInfo extends Component {

    componentWillMount() {
        attachModelToView(new CustomerDetailsInfoModel(this.props), this)
    }

    render() {

        if (!this.state.customerDetailsAdditionalInfo) {
            return <div></div>
        }
        
        const { t } = this.props           
                
        const contactItems = this.state.customerDetailsContact && this.state.customerDetailsContact.map((c,ix) => (<li key={ix}>
            <span>{ c.iconURL && <img alt="i" src={c.iconURL}/> }</span>
            <span>{c.value}</span>
            <span className="copyPasteButton" title={t("Copy")}><img alt="c" src="/images/copy-icon.png" width="20px"/></span>
        </li>))

        const additionalInfoItems = this.state.customerDetailsAdditionalInfo && this.state.customerDetailsAdditionalInfo.map((c,ix) => (<li className="additionalInfoItem" key={ix}>
            <span>{ c.iconURL && <img alt="i" src={c.iconURL}/> }</span>
            <div className="value"> {c.value}</div>            
            {c.label}
        </li>))

        return (
            <div className="body">
                <div className="detailsRow">
                    <h3>{t("Contact")}</h3>
                    <ul>
                        { contactItems }
                    </ul>
                </div>
                <div className="detailsRow">
                    <h3>{t("Additional info")}</h3>
                    <ul className="additionalInfo">
                        { additionalInfoItems }
                    </ul>
                </div>
            </div>
        )
    }
}

export default withI18n()(CustomerDetailsInfo)
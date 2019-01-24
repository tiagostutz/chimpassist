import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import CustomerDetailsActivityModel from './CustomerDetailsActivity.model'

import { withI18n } from "react-i18next";
  
import '../i18n.js'

class CustomerDetailsActivity extends Component {

    componentWillMount() {
        attachModelToView(new CustomerDetailsActivityModel(this.props.session), this)
    }

    render() {
        
        const { t } = this.props   
        
        return (
            <div className="body activity">
                <div className="detailsRow">
                    <h3>{t("Agora")}</h3>
                    <ul>
                        <li>{this.state.currentAtividadeTitulo}</li>
                        <li>Velocidade Leitura: {this.state.lastSpeedY ? this.state.lastSpeedY : 0} mins</li>
                        <li>Posição texto: {this.state.currentPositionY}%</li>
                    </ul>
                </div>
                <div className="detailsRow">
                    <h3>{t("Últimas 24 horas")}</h3>
                    <ul>
                        
                    </ul>
                </div>
                <div className="detailsRow">
                    <h3>{t("Últimos 7 dias")}</h3>
                    <ul>
                        
                    </ul>
                </div>
                <div className="detailsRow">
                    <h3>{t("Histórico")}</h3>
                    <ul>
                        
                    </ul>
                </div>
            </div>
        )
    }
}

export default withI18n()(CustomerDetailsActivity)
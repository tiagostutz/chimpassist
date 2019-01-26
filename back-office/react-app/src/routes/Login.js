import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import LoginModel from './Login.model'


import { withI18n } from "react-i18next";

import './Login.css'

class Login extends Component {

    componentWillMount() {
        attachModelToView(new LoginModel(), this)
    }

    render() {
        const { t } = this.props
        const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/avatar-demo.png"

        return (
            <div className="loginForm">
                <div className="row">
                    <img src={logoURL} alt="Logo"/>
                </div>
                <div className="row">
                    <input placeholder="e-mail" autoFocus />
                </div>
                <div className="row">
                    <input placeholder="senha" />
                </div>                
                <div className="row">
                    <button onClick={() => this.viewModel.login()}>{t("Sign in")}</button>
                </div>
                <div className="forgotPass">
                    <a>{t("Forgot password?")}</a>
                </div>

            </div>
        )
    }
}

export default withI18n()(Login)
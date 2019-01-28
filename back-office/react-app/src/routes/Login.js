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
                <form onSubmit={e => e.preventDefault()}>
                    <div className="row">
                        <img src={logoURL} alt="Logo"/>
                    </div>
                    {this.state.errorMessage && 
                        <div className="row errorMessageArea">
                            {t(this.state.errorMessage)}
                        </div>
                    }
                    <div className="row">
                        <input placeholder="e-mail" type="email" autoFocus onChange={e => this.viewModel.email=e.target.value} />
                    </div>
                    <div className="row">
                        <input placeholder="senha" type="password" onChange={e => this.viewModel.password=e.target.value} />
                    </div>                
                    <div className="row">
                        <button disabled={!this.state.email || !this.state.password} onClick={() => this.viewModel.login()}>{t("Sign in")}</button>
                    </div>
                    <div className="forgotPass">
                        <a>{t("Forgot password?")}</a>
                    </div>

                </form>
            </div>
        )
    }
}

export default withI18n()(Login)
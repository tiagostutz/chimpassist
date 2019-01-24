import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import LoginModel from './Login.model'

import './Login.css'

export default class Login extends Component {

    componentWillMount() {
        attachModelToView(new LoginModel(), this)
    }

    render() {
        const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/edidatico.png"

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
                    <button onClick={() => this.viewModel.login()}>Entrar</button>
                </div>
                <div className="forgotPass">
                    <a>Esqueceu a senha?</a>
                </div>

            </div>
        )
    }
}
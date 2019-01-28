import React, { Component } from 'react';
import { attachModelToView } from 'rhelena'

import ChatStation from './routes/ChatStation'
import Login from './routes/Login'


import { withI18n } from "react-i18next";
  
import './i18n.js'
import AppModel from './App.model'

import './App.css';

// import i18n from "i18next";
import 'moment/locale/pt-br';
// i18n.changeLanguage("ptBR")
class App extends Component {

  componentWillMount() {
    attachModelToView(new AppModel(), this)
  }

  render() {

    const { t } = this.props      
    const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/avatar-demo.png"

    let main = (
      <div className="wrapper">
        <div className="sideMenu">
          <div style={{flex:1}}>
            <img src={logoURL} alt="Logo"/>
          </div>
          <div  style={{flex:1}}>
            <button onClick={() => this.viewModel.logout()}>{t("logout")}</button>
          </div>
        </div>
        <div className="chatArea">
          <ChatStation />
        </div>
      </div>
    )

    if (!this.state.loggedUser) {
      main = (
        <div className="wrapper">
          <Login />
        </div>
      )
    }

    return main
  }
}

export default withI18n()(App)
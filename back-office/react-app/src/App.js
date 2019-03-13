import React, { Component } from 'react';
import { attachModelToView, globalState } from 'rhelena'
import { Helmet } from "react-helmet";

import ChatStation from './routes/ChatStation'
import Login from './routes/Login'


import { withI18n } from "react-i18next";

import AppModel from './App.model'

import './App.css';

class App extends Component {

  componentWillMount() {
    attachModelToView(new AppModel(), this)
  }

  render() {

    const { t } = this.props      
    const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/avatar-demo.png"

    let main = (
      <div className="wrapper">
        <Helmet>
          <title>{process.env.REACT_APP_MAIN_PAGE_TITLE}</title>
        </Helmet>
        <div className="sideMenu">
          <div style={{flex:1}}>
            <img src={logoURL} alt="Logo"/>
            <div>{globalState.loggedUser && globalState.loggedUser.name.split(' ')[0]}</div>
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
          <Helmet>
            <title>{process.env.REACT_APP_LOGIN_PAGE_TITLE}</title>
          </Helmet>
          <Login />
        </div>
      )
    }

    return main
  }
}

export default withI18n()(App)

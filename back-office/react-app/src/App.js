import React, { Component } from 'react';
import { attachModelToView } from 'rhelena'

import ChatStation from './routes/ChatStation'
import Login from './routes/Login'

import AppModel from './App.model'

import './App.css';

import i18n from "i18next";
import 'moment/locale/pt-br';
i18n.changeLanguage("ptBR")
class App extends Component {

  componentWillMount() {
    attachModelToView(new AppModel(), this)
  }

  render() {

    const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/edidatico.png"

    let main = (
      <div className="wrapper">
        <div className="sideMenu">
          <div>
            <img src={logoURL} alt="Logo"/>
          </div>
          <div>
            <button onClick={() => this.viewModel.logout()}>sair</button>
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

export default App;
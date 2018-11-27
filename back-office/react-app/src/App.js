import React, { Component } from 'react';
import ChatStation from './routes/ChatStation'

import './App.css';

import i18n from "i18next";
import 'moment/locale/pt-br';
i18n.changeLanguage("ptBR")
class App extends Component {

  render() {

    const logoURL = process.env.REACT_APP_LOGO_SMALL_URL || "/images/edidatico.png"

    return (
      <div className="wrapper">
        <div className="sideMenu">
          <img src={logoURL} alt="Logo"/>
        </div>
        <div className="chatArea">
          <ChatStation />  
        </div>
      </div>
    );
  }
}

export default App;
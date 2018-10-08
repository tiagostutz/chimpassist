import React, { Component } from 'react';
import i18n from "i18next";
import ChatStation from './routes/ChatStation'

import './App.css';

import 'moment/locale/pt-br';
i18n.changeLanguage("ptBR")
class App extends Component {

  render() {

    return (
      <div className="wrapper">
        <div className="sideMenu">
          <img src="/images/logo-demo.png" alt="Logo"/>
        </div>
        <div className="chatArea">
          <ChatStation />  
        </div>
      </div>
    );
  }
}

export default App;
import React, { Component } from 'react';

import './App.css';

import ChatStation from './routes/ChatStation'

class App extends Component {

  render() {

    return (
      <div className="wrapper">
        <div className="sideMenu">
          <img src="/images/logo-demo.png" />
        </div>
        <div className="chatArea">
          <ChatStation />  
        </div>
      </div>
    );
  }
}

export default App;
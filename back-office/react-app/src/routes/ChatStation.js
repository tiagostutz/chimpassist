import React, { Component } from 'react';
import { attachModelToView } from 'rhelena'

import ChatList from '../components/ChatList'
import Chat from '../components/Chat'

import { ThemeProvider } from '@livechat/ui-kit'

import './ChatStation.css';
import ChatStationModel from './ChatStation.model';

  //
  // @livechat/ui-kit theme
  //
  const textComposeTheme = {
    ChatListItem: {
      css: {
        padding: "1rem"
      }
    },
    TextComposer: {
      css: {
        backgroundColor: "#EEE",
        padding: ".75rem"
      },
      TextInput: {
        css: {
          padding: ".5rem",
          marginRight: "1.25rem",
          borderRadius: "1.5rem",
          paddingLeft: "1rem"
        }
      }
    },
    MessageList: {
      css: {
        background: "transparent"
      },
    }
  }

export default class ChatStation extends Component {

  componentWillMount() {
    attachModelToView(new ChatStationModel(), this)
  }

  render() {
    
    return (
      <ThemeProvider theme={textComposeTheme}>

        <div className="mainArea">
            <div className="chatListPane">
            { this.state.status }
              <ChatList />
            </div>

            <div className="inputMessagePane">
              <Chat />
            </div>

        </div>

      </ThemeProvider>
    );
  }
  
}


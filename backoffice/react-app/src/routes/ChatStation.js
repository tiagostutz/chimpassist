import React, { Component } from 'react';

import ChatList from '../components/ChatList'
import Chat from '../components/Chat'

import { ThemeProvider } from '@livechat/ui-kit'

import './ChatStation.css';

  //
  // @livechat/ui-kit theme
  //
  const textComposeTheme = {
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
      }
    }
  }

export default class ChatStation extends Component {


  render() {
    return (
      <ThemeProvider theme={textComposeTheme}>

        <div className="mainArea">

            <div className="chatListPane">
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


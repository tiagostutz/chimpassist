import React, { Component } from 'react';
import './App.css';

import { 
  ThemeProvider, 
  ChatList, 
  ChatListItem,
  Avatar,
  Column,
  Row,
  Title,
  Subtitle,
  TextComposer,
  Fill,
  Fit,
  TextInput,
  SendButton,
  MessageList
} from '@livechat/ui-kit'

import { Container as GridContainer, Row as GridRow, Col as GridColumn } from 'react-grid-system';

class App extends Component {
  render() {
    return (
      <div>
        <ThemeProvider>
          <GridRow>
            <GridColumn>
              <ChatList>
                <ChatListItem>
                  <Avatar letter="K" />
                  <Column fill>
                    <Row justify>
                      <Title ellipsis>{'Konrad'}</Title>
                      <Subtitle nowrap>{'14:31 PM'}</Subtitle>
                    </Row>
                    <Subtitle ellipsis>
                      {'Hello, how can I help you? We have a lot to talk about'}
                    </Subtitle>
                  </Column>
                </ChatListItem>
                <ChatListItem active>
                  <Avatar letter="J" />
                  <Column fill>
                    <Row justify>
                      <Title ellipsis>{'Andrew'}</Title>
                      <Subtitle nowrap>{'14:31 PM'}</Subtitle>
                    </Row>
                    <Subtitle ellipsis>{'actually I just emailed you back'}</Subtitle>
                  </Column>
                </ChatListItem>
                <ChatListItem>
                  <Avatar imgUrl="https://livechat.s3.amazonaws.com/default/avatars/male_8.jpg" />
                  <Column fill>
                    <Row justify>
                      <Title ellipsis>{'Michael'}</Title>
                      <Subtitle nowrap>{'14:31 PM'}</Subtitle>
                    </Row>
                    <Subtitle ellipsis>
                      {"Ok, thanks for the details, I'll get back to you tomorrow."}
                    </Subtitle>
                  </Column>
                </ChatListItem>
              </ChatList>
            </GridColumn>
            
            <GridColumn>
              <div>
                <MessageList active containScrollInSubtree>
                </MessageList>
              </div>
              <TextComposer onSend={() =>{}}>
                <Row align="center">
                  <Fill>
                    <TextInput />
                  </Fill>
                  <Fit>
                    <SendButton />
                  </Fit>
                </Row>
              </TextComposer>
            </GridColumn>

          </GridRow>   
        </ThemeProvider>
      </div>

    );
  }
}

export default App;

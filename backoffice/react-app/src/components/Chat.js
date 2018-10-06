import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatModel from './Chat.model'

import { 
    Row,
    TextComposer,
    SendButton,
    TextInput,
    MessageList,
    Message,
    MessageGroup,
    MessageText
  } from '@livechat/ui-kit'

  
import './Chat.css'

export default class Chat extends Component {

    componentWillMount() {
        attachModelToView(new ChatModel(), this)
    }

    render() {
        return (            
            <div className="chatView">
                <MessageList  active containScrollInSubtree>

                    <Message key="22" isOwn={true} date="21:37">
                        <MessageText>No problem!</MessageText>
                    </Message>
                    
                    <MessageGroup
                        avatar="https://livechat.s3.amazonaws.com/default/avatars/male_8.jpg"
                        onlyFirstWithMeta
                        >
                        <Message date="21:37">
                            <MessageText>No problem!</MessageText>
                        </Message>
                        <Message
                        
                            imageUrl="https://static.staging.livechatinc.com/1520/P10B78E30V/dfd1830ebb68b4eefe6432d7ac2be2be/Cat-BusinessSidekick_Wallpapers.png"
                            date="21:39"
                        >
                            <MessageText>
                            The fastest way to help your customers - start chatting with visitors
                            who need your help using a free 30-day trial.
                            </MessageText>
                        </Message>
                    </MessageGroup>

                        <Message date="21:37" className="messageBubble">
                            <MessageText>No problem!</MessageText>
                        </Message>

                        <Message date="21:37" isOwn={true}>
                            <MessageText>No problem!</MessageText>
                        </Message>

                        <Message date="21:37">
                            <MessageText>No problem!</MessageText>
                        </Message>

                    <MessageGroup
                        avatar="https://livechat.s3.amazonaws.com/default/avatars/male_8.jpg"
                        onlyFirstWithMeta>
                        <Message date="21:37" isOwn={true}>
                            <MessageText>No problem!</MessageText>
                        </Message>
                        <Message date="21:37" isOwn={true}>
                            <MessageText>Waiting here! Waiting here! Waiting here! Waiting here! <br /> Waiting here!</MessageText>
                        </Message>

                        <Message date="21:37" isOwn={true}>
                            <MessageText>No problem!</MessageText>
                        </Message>
                    </MessageGroup>
                        <Message date="21:37">
                            <MessageText>No problem!</MessageText>
                        </Message>

                        <Message date="21:37">
                            <MessageText>No problem!</MessageText>
                        </Message>

                        <Message date="21:37">
                            <MessageText>No problem!</MessageText>
                        </Message>

                </MessageList>
                
                <TextComposer>
                    <Row align="center">
                    <TextInput fill placeholder="Digite sua mensagem..." />
                    <SendButton fit />
                    </Row>
                </TextComposer>

            </div>

        )
    }
}
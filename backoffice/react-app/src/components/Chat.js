import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatModel from './Chat.model'

import { 
    Avatar,
    Row,
    TextComposer,
    SendButton,
    TextInput,
    MessageList,
    Message,
    MessageGroup,
    MessageText
  } from '@livechat/ui-kit'
  
import { withI18n } from "react-i18next";
  
import '../i18n.js'
import './Chat.css'

class Chat extends Component {

    componentWillMount() {
        attachModelToView(new ChatModel(), this)
    }

    render() {
        
        if (!this.state.costumer) {
            return <div className="chatView"></div>
        }    

        let messages = []
        let groupMessage = null
        this.state.costumer.lastMessages.forEach(m => {
            if (!groupMessage || groupMessage.userId !== m.user.id) {
                groupMessage = {
                    userId: m.user.id,
                    avatar: m.user.avatarURL,
                    messages: []
                }
                messages.push(groupMessage)
            }
            groupMessage.messages.push(m)
        })

        return (                        
            <div className="chatView">
                <div className="chatHeader">
                    <div>
                        <Avatar letter={this.state.costumer.avatarURL ? null : this.state.costumer.name.substring(0,1)} imgUrl={this.state.costumer.avatarURL ? this.state.costumer.avatarURL : null} />
                    </div>
                    <div className="headerTitle">
                        <h1>{this.state.costumer.name}</h1>
                        <span>{ this.state.costumer.lastSeenAt.calendar() }</span>
                    </div>
                </div>
                <MessageList  active containScrollInSubtree>

                    { 
                        messages.map((g,idx) => {
                            return (
                                <MessageGroup key={idx} onlyFirstWithMeta>
                                {
                                    g.messages.map((m, ix) => {
                                        return (
                                            <Message key={"gr_" + ix} date={m.dateTime} isOwn={m.user.id === this.state.loggedUser.id} authorName={m.user.name}>
                                                <MessageText>
                                                    {m.text}
                                                </MessageText>
                                            </Message>
                                        )
                                    })
                                }
                                </MessageGroup>
                                )
                            })
                    }

                </MessageList>
                
                <TextComposer>
                    <Row align="center">
                        <TextInput placeholder="Digite sua mensagem..." />
                        <SendButton fit />
                    </Row>
                </TextComposer>

            </div>
            

        )
    }
}

export default withI18n()(Chat)
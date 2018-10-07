import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatListItemModel from './ChatListItem.model'


import { 
    ChatListItem as UIChatListItem,
    Avatar,
    Column,
    Row,
    Title,
    Subtitle
  } from '@livechat/ui-kit'

import './ChatListItem.css'

export default class ChatListItem extends Component {

    componentWillMount() {
        attachModelToView(new ChatListItemModel(this.props.chatInfo), this)
    }

    render() {
        return (
            <UIChatListItem active={this.state.active}>
                <Avatar letter={this.state.costumer.avatarURL ? null : this.state.costumer.name.substring(0,1)} imgUrl={this.state.costumer.avatarURL ? this.state.costumer.avatarURL : null} />
                <Column>
                    <Row justify>
                    <Title ellipsis>{this.state.costumer.name}</Title>
                    {this.state.lastMessage && <Subtitle nowrap>{this.state.lastMessage.timestamp}</Subtitle> }
                    </Row>
                    <Subtitle ellipsis>
                    {'Hello, how can I help you? We have a lot to talk about'}
                    </Subtitle>
                </Column>
            </UIChatListItem>

        )
    }
}
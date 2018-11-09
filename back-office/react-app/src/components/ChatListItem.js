import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatListItemModel from './ChatListItem.model'
import moment from 'moment'

import { 
    ChatListItem as UIChatListItem,
    Avatar,
    Column,
    Row,
    Title,
    Subtitle
  } from '@livechat/ui-kit'

import status from '../status'
import './ChatListItem.css'

export default class ChatListItem extends Component {

    componentWillMount() {
        attachModelToView(new ChatListItemModel(this.props.session), this)
    }
    
    render() {
        
        let msgTimestamp = ""        
        if (this.state.session.lastMessages[0]) {
            msgTimestamp = moment(this.state.session.lastMessages[0].timestamp).format("L")
        }
        
        return (
            <UIChatListItem active={this.state.active} onClick={() => this.viewModel.onSelect()}>
                <Avatar letter={this.state.session.customer.avatarURL ? null : this.state.session.customer.name.substring(0,1)} imgUrl={this.state.session.customer.avatarURL ? this.state.session.customer.avatarURL : null} />
                <Column>
                    <Row justify className="itemListCustomerName">
                        <Title ellipsis>{this.state.session.customer.name}</Title>
                        {!this.state.session.status === status.session.online && this.state.session.lastMessages[0] && <Subtitle nowrap>{msgTimestamp}</Subtitle> }
                    </Row>
                    <Subtitle ellipsis>
                    { this.state.session.lastMessages[0] ? this.state.session.lastMessages[this.state.session.lastMessages.length-1].content : ''}
                    </Subtitle>
                </Column>
            </UIChatListItem>

        )
    }
}
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

import './ChatListItem.css'

export default class ChatListItem extends Component {

    componentWillMount() {
        attachModelToView(new ChatListItemModel(this.props.customerId), this)
    }

    render() {
        
        let msgTimestamp = ""
        if (this.state.customer.lastMessages[0]) {
            msgTimestamp = moment(this.state.customer.lastMessages[0].timestamp).format("L")
        }
        return (
            <UIChatListItem active={this.state.active} onClick={() => this.viewModel.onSelect()}>
                <Avatar letter={this.state.customer.avatarURL ? null : this.state.customer.name.substring(0,1)} imgUrl={this.state.customer.avatarURL ? this.state.customer.avatarURL : null} />
                <Column>
                    <Row justify className="itemListCustomerName">
                        <Title ellipsis>{this.state.customer.name}</Title>
                        {!this.state.customer.isOnline && this.state.customer.lastMessages[0] && <Subtitle nowrap>{msgTimestamp}</Subtitle> }
                    </Row>
                    <Subtitle ellipsis>
                    { this.state.customer.lastMessages[0] ? this.state.customer.lastMessages[this.state.customer.lastMessages.length-1].content : ''}
                    </Subtitle>
                </Column>
            </UIChatListItem>

        )
    }
}
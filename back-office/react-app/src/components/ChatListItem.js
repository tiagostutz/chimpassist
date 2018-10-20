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
        attachModelToView(new ChatListItemModel(this.props.costumerId), this)
    }

    render() {
        
        let msgTimestamp = ""
        if (this.state.costumer.lastMessages[0]) {
            msgTimestamp = moment(this.state.costumer.lastMessages[0].timestamp).calendar()
        }
        return (
            <UIChatListItem active={this.state.active} onClick={() => this.viewModel.onSelect()}>
                <Avatar letter={this.state.costumer.avatarURL ? null : this.state.costumer.name.substring(0,1)} imgUrl={this.state.costumer.avatarURL ? this.state.costumer.avatarURL : null} />
                <Column>
                    <Row justify className="itemListCostumerName">
                        <Title ellipsis>{this.state.costumer.name}</Title>
                        {this.state.costumer.lastMessages[0] && <Subtitle nowrap>{msgTimestamp}</Subtitle> }
                    </Row>
                    <Subtitle ellipsis>
                    { this.state.costumer.lastMessages[0] ? this.state.costumer.lastMessages[this.state.costumer.lastMessages.length-1].content : ''}
                    </Subtitle>
                </Column>
            </UIChatListItem>

        )
    }
}
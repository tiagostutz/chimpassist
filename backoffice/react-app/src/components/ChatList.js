import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatListModel from './ChatList.model'

import ChatListItem from './ChatListItem'
import { 
    ChatList as UIChatList
  } from '@livechat/ui-kit'

  import './ChatList.css'
  

export default class ChatList extends Component {

    componentWillMount() {
        attachModelToView(new ChatListModel(), this)
    }

    render() {
        return (
            <div>
                <UIChatList>
                    <ChatListItem chatInfo={{
                        costumer: {
                            name: "Leonard"
                        },
                        lastMessage: {

                        }
                    }} />
                    <ChatListItem chatInfo={{
                        costumer: {
                            name: "Rose"
                        },
                        lastMessage: {

                        }
                    }} />
                </UIChatList>
            </div>
  
        )
    }
}
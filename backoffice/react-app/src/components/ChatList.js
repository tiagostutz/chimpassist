import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import ChatListModel from './ChatList.model'

import ChatListItem from './ChatListItem'
import { 
    ChatList as UIChatList
  } from '@livechat/ui-kit'

    
import { withI18n } from "react-i18next";
  
import '../i18n.js'
import './ChatList.css'
  

class ChatList extends Component {

    componentWillMount() {
        attachModelToView(new ChatListModel(), this)
    }

    render() {
        const { t } = this.props

        return (
            <div className="costumerList">

                <div className="onlineCostumers">
                    <h1>{t("Online costumers")}</h1>
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

                <div className="otherCostumers">
                    <h1>{t("Other costumers")}</h1>
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
            </div>
  
        )
    }
}

export default withI18n()(ChatList)
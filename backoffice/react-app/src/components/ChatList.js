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
                        { this.state.onlineCostumers.map((c,idx) => {
                            return <ChatListItem costumerId={c.id} key={idx} />
                        })}
                    </UIChatList>
                </div>

                <div className="offlineCostumers">
                    <h1>{t("Offline costumers")}</h1>
                    <UIChatList>
                        { this.state.offlineCostumers.map((c,idx) => {
                            return <ChatListItem costumerId={c.id} key={idx} />
                        })}
                    </UIChatList>
                </div>
            </div>
  
        )
    }

}

export default withI18n()(ChatList)
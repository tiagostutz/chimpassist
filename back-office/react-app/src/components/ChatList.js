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

        const onlineCustomersLabel = process.env.REACT_APP_ONLINE_CUSTOMERS_LABEL || "Online customers"
        const offlineCustomersLabel = process.env.REACT_APP_OFFLINE_CUSTOMERS_LABEL || "Offline customers"

        const offlineCustomers = this.state.offlineSessions.map(s => <ChatListItem session={s} key={"offline-"+s.sessionId} />)
        const onlineCustomers = this.state.onlineSessions.map(s => <ChatListItem session={s} key={"online-"+s.sessionId} />)
        
        return (
            <div className="sessionList">

                <div className="onlineSessions">
                    <h1>{t(onlineCustomersLabel)}</h1>
                    <UIChatList>
                        { onlineCustomers }
                    </UIChatList>
                </div>

                <div className="offlineSessions">
                    <h1>{t(offlineCustomersLabel)}</h1>
                    <UIChatList>
                        { offlineCustomers }
                    </UIChatList>
                </div>
            </div>
  
        )
    }

}

export default withI18n()(ChatList)
import React  from 'react'
import { 
    MessageList
} from '@livechat/ui-kit'

import ChimpMessageGroup from './ChimpMessageGroup'
import './ChimpMessageComponent.css'

export default ({messages, userId}) => {

    let groupedMessages = []
    
    if (messages) {
        let groupMessage = null
        messages.forEach(m => {
            if (!groupMessage || groupMessage.userId !== m.from.id) {
                groupMessage = {
                    userId: m.from.id,
                    avatarURL: m.from.avatarURL,
                    messages: []
                }
                groupedMessages.push(groupMessage)
            }
            if (m.timestamp) {
                groupMessage.messages.push(m)
            }
        })
    }
  
    return (
        <MessageList  active containScrollInSubtree>
        { 
            groupedMessages.map((g,idx) => <ChimpMessageGroup userId={userId} groupedMessage={g} key={`msgrp_${idx}`} /> )
        }
        </MessageList>
    )
}
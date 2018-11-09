import React from 'react'
import ChimpMessageBubble from './ChimpMessageBubble'
import ChimpMessageText from './ChimpMessageText'

import moment from 'moment'

export default ({groupedMessage, userId}) => {

    const firstMessage = groupedMessage.messages[0]
    const messageHeader = <div className="groupedMessageName">{firstMessage.from.name}</div>         
    const isOwn = firstMessage.from.id === userId
    
    return (
        <div className={isOwn ? " groupedMessage right": "groupedMessage left"}>
            { 
                groupedMessage.messages.map((m, ix) => { 
                    return (
                        <ChimpMessageBubble key={`msgin_${ix}`}>
                            { ix === 0 && !isOwn && messageHeader}
                            <ChimpMessageText text={m.content} />
                            <div className="groupedMessageTimestamp">{moment(new Date(firstMessage.timestamp)).format("LT")}</div>
                        </ChimpMessageBubble>
                    ) 
                })
            }
        </div>
    )
}
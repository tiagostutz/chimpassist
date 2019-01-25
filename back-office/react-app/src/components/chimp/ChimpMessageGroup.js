import React from 'react'
import ChimpMessageBubble from './ChimpMessageBubble'
import ChimpMessageText from './ChimpMessageText'

import singleTick from './single-tick.png' 
import doubleTick from './double-tick.png' 
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
                            <div className="groupedMessageTimestamp">
                                <div className="readTimeContainer">
                                    <div className="readAtInfo">
                                        <div className="readAtInfo">
                                            <span className="timestamp">{moment(new Date(m.timestamp)).format("LT")}</span>
                                            { isOwn && <img src={singleTick} /> }
                                        </div>
                                        { isOwn && m.readAt && 
                                        <div className="readAtInfo" style={{marginLeft: ".4rem"}}>
                                            <span className="timestamp">{moment(new Date(m.readAt)).format("LT")}</span>
                                            <img src={singleTick} style={{marginRight: "-10px"}} />
                                            <img src={singleTick} style={{opacity: 1}} />
                                        </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </ChimpMessageBubble>
                    ) 
                })
            }
        </div>
    )
}
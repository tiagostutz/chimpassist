import React  from 'react'
import { 
    MessageList, 
    MessageGroup,
    Message,
    MessageText
} from '@livechat/ui-kit'

import moment from 'moment'
import { withI18n } from "react-i18next";
import './i18n.js'

import doubleTick from './double-tick.png'
import singleTick from './single-tick.png'
import './ChimpMessageList.css'

const component = ({session, userId, t}) => {

    let messages = []
    
    if (session) {
        let groupMessage = null
        session.lastMessages.forEach(m => {
            if (!groupMessage || groupMessage.userId !== m.from.id) {
                groupMessage = {
                    userId: m.from.id,
                    avatarURL: m.from.avatarURL,
                    messages: []
                }
                messages.push(groupMessage)
            }
            if (m.timestamp) {
                groupMessage.messages.push(m)
            }
        })
    }
  
    return (
        <MessageList  active containScrollInSubtree>
        { 
            messages.map((g,idx) => {
                return (
                    <MessageGroup key={idx} onlyFirstWithMeta>
                    {
                        g.messages.map((m, ix) => {
                            return (
                                <Message key={"gr_" + ix} date={moment(new Date(m.timestamp)).fromNow()} isOwn={m.from.id === userId} authorName={m.from.id === userId ? t("You") : m.from.name}>
                                        <MessageText>
                                            <div>
                                                {m.content}                                        
                                            </div>
                                            { m.from.id === userId &&
                                                <div className="readTimeContainer">
                                                    <div className="readAtInfo">
                                                        {<div className="readAtInfo">
                                                            <span className="timestamp">{moment(new Date(m.timestamp)).format("LT")}</span>
                                                            <img src={singleTick} />
                                                        </div>}
                                                        {m.readAt && 
                                                            <div className="readAtInfo" style={{marginLeft: ".5rem"}}>
                                                                <span className="timestamp">{moment(new Date(m.readAt)).format("LT")}</span>
                                                                <img src={singleTick} style={{marginRight: "-10px"}} />
                                                                <img src={singleTick} style={{opacity: 1}} />
                                                            </div>}
                                                    </div>
                                                </div>
                                            }
                                        </MessageText>
                                </Message>
                            )
                        })
                    }
                    </MessageGroup>
                    )
                })
        }
        </MessageList>
    )
}

export default withI18n()(component)
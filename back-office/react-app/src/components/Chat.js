import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import moment from 'moment'
import ChatModel from './Chat.model'
import CustomerDetails from './CustomerDetails'
import { 
    Avatar,
    Row,
    TextComposer,
    SendButton,
    TextInput
  } from '@livechat/ui-kit'

import ChimpMessageList from './chimp/ChimpMessageList'
  
import { withI18n } from "react-i18next";
import '../i18n.js'

import status from '../status'
import './Chat.css'

class Chat extends Component {

    componentWillMount() {
        attachModelToView(new ChatModel(), this)
    }

    render() {
        
        if (!this.state.session) {
            return <div className="chatView"></div>
        }    

        const lastSeenAtMoment = moment(this.state.session.customer.lastSeenAt)

        return (                        
            <div className="chatView">
                <header className="chatHeader">
                    <div className="headerLeft">
                        <div>
                            <Avatar letter={this.state.session.customer.avatarURL ? null : this.state.session.customer.name.substring(0,1)} imgUrl={this.state.session.customer.avatarURL ? this.state.session.customer.avatarURL : null} />
                        </div>
                        <div className={"headerTitle " + (this.state.session.status === status.session.online ? "customerOnline" : "customerOffline")}>
                            <h1>{this.state.session.customer.name}</h1>
                            <span>{ lastSeenAtMoment.calendar() }</span>
                        </div>
                    </div>
                    <div>
                        <div className="moreInfo" onClick={() => this.viewModel.toggleCustomerDetails()}>
                            <img src="/images/show-more.png" className={this.state.showCustomerDetails ? "active" : ""} alt="Info" />
                        </div>
                    </div>
                </header>
                <div className="chatBody">  
                    <div className="messageArea">

                        <ChimpMessageList messages={this.state.session.lastMessages} userId={this.state.loggedUser.id} />
                        
                        <TextComposer onSend={(data) => this.viewModel.sendMessage(data)}>
                            <Row align="center">
                                <TextInput placeholder="Digite sua mensagem..." />
                                <SendButton fit />
                            </Row>
                        </TextComposer>
                    </div>              
                    <div className={`customerDetails ${this.state.showCustomerDetails ? "showCustomerDetails" : ""}`}>
                        <CustomerDetails session={this.state.session} />
                    </div>
                </div>
            </div>
            
        )
    }
}


export default withI18n()(Chat)
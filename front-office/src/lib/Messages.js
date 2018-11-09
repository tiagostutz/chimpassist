import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'

import MessagesModel from './Messages.model'
import ChimpMessageList from './ChimpMessageList'

export default class Messages extends Component {

    componentWillMount() {
        attachModelToView(new MessagesModel(this.props.sessionTopic), this)
    }
    componentWillUnmount() {
		// remove manuh listeners
		this.viewModel.clearListeners()
	}

    render() {

        const messageListStyle = {
            flexGrow: 1,
            minHeight: 0,
            height: '100%',
        }
  
        return (
            <div style={messageListStyle}>
                <ChimpMessageList session={this.state.session} userId={this.state.userData.id} />
            </div>
        )
    }
}
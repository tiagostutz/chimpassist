import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import { IconButton, ChatIcon } from '@livechat/ui-kit'

import status from './services/status'
import MinimizedModel from './Minimized.model'

export default class Minimized extends Component {

	componentWillMount() {
		attachModelToView(new MinimizedModel(), this)
	}

	componentWillUnmount() {
		// remove manuh listeners
		this.viewModel.clearListeners()
	}

	render() {
		const bgColor = (this.state.session && this.state.session.status === status.session.online) ? '#0093FF' : "gray"
		return (
			<div
				onClick={this.props.maximize}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: '60px',
					height: '60px',
					background: bgColor,
					color: '#fff',
					borderRadius: '50%',
					cursor: 'pointer',
				}}
			>
				<IconButton color="#fff">
					<ChatIcon />
				</IconButton>
			</div>
		)
	}
}
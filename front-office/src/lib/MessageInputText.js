import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import { 
    TextComposer, 
    Row,
    Fill,
    TextInput,
    Fit,
    SendButton
} from '@livechat/ui-kit'
import { withI18n } from "react-i18next";
import './i18n.js'

import MessageInputTextModel from './MessageInputText.model'

class MessageInputText extends Component {

    componentWillMount() {
        attachModelToView(new MessageInputTextModel(), this)
    }

    render() {
        const { t } = this.props        
        return (            
            <TextComposer onSend={message => this.viewModel.sendMessage(message)}>
                <Row align="center">
                    <Fill>
                        <TextInput placeholder={t("Write a message") + "..."} />
                    </Fill>
                    <Fit>
                        <SendButton />
                    </Fit>
                </Row>
            </TextComposer>
        )
    }
}
export default withI18n()(MessageInputText)
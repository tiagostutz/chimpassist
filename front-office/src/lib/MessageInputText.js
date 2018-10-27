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
  
import MessageInputTextModel from './MessageInputText.model'

export default class MessageInputText extends Component {

    componentWillMount() {
        attachModelToView(new MessageInputTextModel(), this)
    }

    render() {
        return (            
            <TextComposer>
                <Row align="center">
                    <Fill>
                        <TextInput />
                    </Fill>
                    <Fit>
                        <SendButton />
                    </Fit>
                </Row>
            </TextComposer>
        )
    }
}
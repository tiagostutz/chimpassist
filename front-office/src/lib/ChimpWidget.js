import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import { 
  ThemeProvider, 
  FixedWrapper
} from '@livechat/ui-kit'

import Minimized from './Minimized'
import Maximized from './Maximized'


import ChimpWidgetModel from './ChimpWidget.model'

export default class ChimpWidget extends Component {

  componentWillMount() {
    attachModelToView(new ChimpWidgetModel(this.props.backendEndpoint, this.props.mqttBrokerHost, this.props.mqttBrokerUsername, this.props.mqttBrokerPassword, this.props.mqttBaseTopic), this)
  }

  render() {

    const themes = {
      defaultTheme: {
        FixedWrapperMaximized: {
          css: {
            boxShadow: '0 0 1em rgba(0, 0, 0, 0.1)',
          },
        },
      }
    }

    return (
      <div>
        <ThemeProvider theme={themes.defaultTheme}>
          <FixedWrapper.Root>
            <FixedWrapper.Maximized>
              <Maximized sessionTopic={this.state.session ? this.state.session.sessionTopic : null} {...this.props} />
            </FixedWrapper.Maximized>
            <FixedWrapper.Minimized>
              <Minimized sessionTopic={this.state.session ? this.state.session.sessionTopic : null}{...this.props} />
            </FixedWrapper.Minimized>
          </FixedWrapper.Root>   
        </ThemeProvider>
      </div>

    );
  }
}


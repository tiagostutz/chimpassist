import React, { Component } from 'react'
import { attachModelToView } from 'rhelena'
import { 
  ThemeProvider, 
  FixedWrapper
} from '@livechat/ui-kit'

import './i18n.js'
import Minimized from './Minimized'
import Maximized from './Maximized'

import ChimpWidgetModel from './ChimpWidget.model'
import 'moment/locale/pt-br';

import moment from 'moment'
var locale = window.navigator.userLanguage || window.navigator.language;
moment.locale(locale)

export default class ChimpWidget extends Component {

  componentWillMount() {
    attachModelToView(new ChimpWidgetModel(this.props), this)
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
              <Maximized {...this.props} />
            </FixedWrapper.Maximized>
            <FixedWrapper.Minimized>
              <Minimized {...this.props} />
            </FixedWrapper.Minimized>
          </FixedWrapper.Root>   
        </ThemeProvider>
      </div>

    );
  }
}


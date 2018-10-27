import React, { Component } from 'react';

import { 
  ThemeProvider, 
  FixedWrapper
} from '@livechat/ui-kit'

import Minimized from './Minimized'
import Maximized from './Maximized'


const themes = {
  defaultTheme: {
    FixedWrapperMaximized: {
      css: {
        boxShadow: '0 0 1em rgba(0, 0, 0, 0.1)',
      },
    },
  }
}
class Widget extends Component {

  render() {

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

export default Widget;

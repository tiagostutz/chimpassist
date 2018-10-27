import React, { Component } from 'react';

import { 
  ThemeProvider, 
  FixedWrapper
} from '@livechat/ui-kit'

import WidgetMinimized from './components/WidgetMinimized'
import WidgetMaximized from './components/WidgetMaximized'

import './App.css';

const themes = {
  defaultTheme: {
    FixedWrapperMaximized: {
      css: {
        boxShadow: '0 0 1em rgba(0, 0, 0, 0.1)',
      },
    },
  }
}
class App extends Component {

  constructor()  {
    super();
  }

  render() {

    return (
      <div>
        <ThemeProvider theme={themes.defaultTheme}>
          <FixedWrapper.Root>
            <FixedWrapper.Maximized ref={this.myRef2}>
              <WidgetMaximized {...this.props} />
            </FixedWrapper.Maximized>
            <FixedWrapper.Minimized>
              <WidgetMinimized {...this.props} />
            </FixedWrapper.Minimized>
          </FixedWrapper.Root>   
        </ThemeProvider>
      </div>

    );
  }
}

export default App;

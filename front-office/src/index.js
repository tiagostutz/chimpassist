import React from 'react';
import manuh from 'manuh'
import { globalState } from 'rhelena'
import topics from './lib/services/topics'
import { render } from "react-dom";
import { ChimpWidget } from "./lib";

const App = () => (
  <div style={{ width: 640, margin: "15px auto" }}>
    <h1>Chimp Assist Widget Demo</h1>
    <ChimpWidget     
      backendEndpoint="http://localhost:3000"
      mqttBrokerHost="http://localhost:8080/mqtt"
      mqttBaseTopic="chimpassist/demo"
      title="Chimp Assist Demo"
     />
  </div>
);

// Detect page focus and notify the application.
// This is useful to mark the message as read and not just as delivered
(function() {
  var hidden = "hidden";

  // Standards:
  if (hidden in document)
    document.addEventListener("visibilitychange", onchange);
  else if ((hidden = "mozHidden") in document)
    document.addEventListener("mozvisibilitychange", onchange);
  else if ((hidden = "webkitHidden") in document)
    document.addEventListener("webkitvisibilitychange", onchange);
  else if ((hidden = "msHidden") in document)
    document.addEventListener("msvisibilitychange", onchange);
  // IE 9 and lower:
  else if ("onfocusin" in document)
    document.onfocusin = document.onfocusout = onchange;
  // All others:
  else
    window.onpageshow = window.onpagehide
    = window.onfocus = window.onblur = onchange;

  function onchange (evt) {
    var v = "visible", h = "hidden",
        evtMap = {
          focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
        };

    evt = evt || window.event;
    let status = "hidden"
    if (evt.type in evtMap) {
      status = evtMap[evt.type];
    } else {
      status = this[hidden] ? "hidden" : "visible";
    }
    
    globalState.windowFocused = (status === "visble")
    manuh.publish(topics.chatStation.window.visibility, { status })
      
  }

  // set the initial state (but only if browser supports the Page Visibility API)
  if( document[hidden] !== undefined )
    onchange({type: document[hidden] ? "blur" : "focus"});
})();

render(<App />, document.getElementById("root"));

/** @jsx React.DOM */
"use strict";

const React = require('react-atom-fork');
const utils = require("../common/utils");
const floop = require("../common/floop");
const flux = require("flukes");
const message_action = require("../common/message_action");

module.exports = React.createClass({displayName: 'exports',
  mixins: [flux.createAutoBinder(['msgs'])],
  handleMessage_: function (event) {
    event.preventDefault();
    const input = this.refs.newMessage.getDOMNode();
    let txt = input.value;
    input.value = "";
    const ret = floop.send_msg({data: txt});
    if (ret) {
      const error = ret.message || ret.toString();
      console.error(error);
      txt = error;
    }
    message_action.user(this.props.username, txt, Date.now());
  },
  componentDidMount: function () {
    this.focus();
  },
  focus: function () {
    this.refs.newMessage.getDOMNode().focus();
  },
  render: function () {
    const msgs = this.props.msgs.map(function (msg) {
      const userColor = utils.user_color(msg.username);
      return (
        React.DOM.div({className: "message"}, 
          React.DOM.div({className: "message-content"}, 
            React.DOM.div({className: "message-timestamp"}, msg.prettyTime), 
            React.DOM.div({className: "message-text"}, 
              React.DOM.span({className: "message-username"}, 
                React.DOM.span({className: "user-color-square", style: {backgroundColor: userColor}}), 
                msg.username, ": "
              ), 
              msg.data
            )
          )
        )
      );
    });
    return (
      React.DOM.div({className: "native-key-bindings floobits-messages-container", style: 
        {overflow: "auto", border: 0, padding: 10, left: 0, top: 0, margin: 0, width: "100%", height: "100%"}, 
        onMouseUp: this.focus
        }, 
        React.DOM.div({className: "chat-input-container"}, 
          React.DOM.form({onSubmit: this.handleMessage_}, 
            React.DOM.input({type: "text", ref: "newMessage", defaultValue: "", className: "chat-input", placeholder: "type here to chat"})
          )
        ), 
        React.DOM.div({className: "messages-list"}, 
          msgs
        )
      )
    );
  }
});

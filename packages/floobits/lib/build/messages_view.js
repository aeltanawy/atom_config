/** @jsx React.DOM */
"use strict";

const flux = require("flukes");
const React = require('react-atom-fork');
const _ = require("lodash");
const utils = require("../common/utils");
const floop = require("../common/floop");
const messageAction = require("../common/message_action");


const LogMessageView = React.createClass({displayName: 'LogMessageView',
  render: function () {
    const message = this.props.message;
    let repeatCountHTML = "";
    if (this.props.repeatCount > 0) {
      repeatCountHTML = (
        React.DOM.span({className: "message-log-repeat"}, "x", this.props.repeatCount + 1)
      );
    }
    return (
      React.DOM.div({className: "message alert alert-" + message.levelName, role: "alert"}, 
        React.DOM.div({className: "message-content"}, 
          React.DOM.div({className: "message-timestamp"}, message.prettyTime), 
          React.DOM.div({className: "message-text"}, React.DOM.img({src: "atom://floobits/resources/icon_64x64.png", className: "floobits-square"}), message.msg, " ", repeatCountHTML, " ")
        )
      )
    );
  }
});

const UserMessageView = React.createClass({displayName: 'UserMessageView',
  getInitialState: function () {
    return {
      ignoredURLs: [],
    };
  },
  ignoreURL: function (url, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const ignoredURLs = this.state.ignoredURLs;
    ignoredURLs.push(url);
    this.setState({ignoredURLs: ignoredURLs});
  },
  render: function () {
    var message = this.props.message,
      urlRegexp = /https?:\/\/\S+/g,
      userColor = utils.user_color(message.username),
      result,
      msgTxt = [],
      before,
      after,
      key = 0,
      prevIndex = 0;

    while (true) {
      result = urlRegexp.exec(message.msg);
      if (!result) {
        msgTxt.push(message.msg.slice(prevIndex));
        break;
      }
      before = message.msg.slice(prevIndex, result.index);
      prevIndex = result.index + result[0].length;
      after = message.msg.slice(prevIndex, urlRegexp.lastIndex);
      let imgOrTxt = result[0];
      if (this.state.ignoredURLs.indexOf(imgOrTxt) === -1 && utils.image_mime_from_extension(imgOrTxt)) {
        imgOrTxt = (
          React.DOM.div({className: "messages-image-container"}, 
            React.DOM.i({className: "glyphicon glyphicon-remove messages-remove-image", onClick: this.ignoreURL.bind(this, imgOrTxt)}), 
            React.DOM.img({src: imgOrTxt})
          ));
      }

      msgTxt.push(
        React.DOM.span({key: key++}, 
          before, 
          React.DOM.a({target: "_blank", href: result[0]}, imgOrTxt), 
          after
        )
      );
    }

    return (
      React.DOM.div({className: "message"}, 
        React.DOM.div({className: "message-content"}, 
          React.DOM.div({style: {}, className: "message-timestamp"}, message.prettyTime), 
          React.DOM.div({style: {}, className: "message-text"}, 
            React.DOM.span({className: "message-username"}, 
              React.DOM.span({className: "user-color-square", style: {backgroundColor: userColor}}), 
              message.username || message.type, ": "
            ), 
            msgTxt
          )
        )
      )
    );
  }
});

const InteractiveMessageView = React.createClass({displayName: 'InteractiveMessageView',
  getInitialState: function () {
    return {
      clicked: null
    };
  },
  onClick: function (button) {
    if (this.state.clicked !== null) {
      return;
    }
    button.action();
    this.setState({clicked: button.id});
  },
  render: function () {
    var message = this.props.message,
      buttons = message.buttons || [];

    buttons = buttons.map(function (b) {
      var classes = "btn ",
        clicked = this.state.clicked;

      if (clicked === null || clicked === b.id) {
        classes += b.classNames.join(" ");
      }
      if (clicked === b.id) {
        classes += " dim";
      }
      return (
        React.DOM.button({key: b.id, className: classes, onClick: this.onClick.bind(this, b)}, b.name)
      );
    }, this);

    return (
      React.DOM.div({className: "message"}, 
        React.DOM.div({className: "message-content"}, 
          React.DOM.div({className: "message-timestamp"}, message.prettyTime), 
          React.DOM.div({className: "message-text"}, 
            message.msg, 
            buttons.length &&
              React.DOM.div({className: "buttons"}, buttons)
            
          )
        )
      )
    );
  }
});

const MessagesView = React.createClass({displayName: 'MessagesView',
  mixins: [flux.createAutoBinder(["messages"])],
  handleMessage_: function (event) {
    event.preventDefault();
    const input = this.refs.newMessage.getDOMNode();
    const value = input.value;
    let ret = floop.send_msg({data: value});
    if (ret) {
      ret = ret.message || ret.toString();
      messageAction.error(ret, false);
      return;
    }
    input.value = "";
    messageAction.user(this.props.username, value, Date.now() / 1000);
  },
  componentDidMount: function () {
    // focus in chat but not editor proxy :(
    if (this.props.focus && this.refs.newMessage) {
      this.focus();
    }
  },
  getMessages: function () {
    const messages = [];
    let prevLogMessage = null;
    this.props.messages.forEach(function (message) {
      if (message.type !== "log") {
        prevLogMessage = null;
        messages.push({message:message});
        return;
      }
      if (prevLogMessage === message.msg) {
        _.last(messages).repeatCount += 1;
        return;
      }
      messages.push({message:message, repeatCount: 0});
      prevLogMessage = message.msg;
    });
    return messages;
  },
  focus: function () {
    this.refs.newMessage.getDOMNode().focus();
  },
  render: function () {
    let chatInput = "";
    const nodes = this.getMessages().map(function (messageObj) {
      const message = messageObj.message;
      switch (message.type) {
        case "user":
          return UserMessageView({message: message, key: message.id});
        case "log":
          return LogMessageView({repeatCount: messageObj.repeatCount, message: message, key: message.id});
        case "interactive":
          return InteractiveMessageView({message: message, key: message.id});
        default:
          console.error("Unknown message type:", message.type);
          break;
      }
    }, this);
    if (!this.props.hideChat) {
      chatInput = (
        React.DOM.div({className: "chat-input-container"}, 
          React.DOM.form({onSubmit: this.handleMessage_, className: "native-key-bindings"}, 
            React.DOM.input({type: "text", ref: "newMessage", defaultValue: "", className: "chat-input native-key-bindings", placeholder: "type here to chat"})
          )
        )
      );
    }

    return (
      React.DOM.div({className: "native-key-bindings floobits-messages-container", style: 
        {overflow: "auto", border: 0, padding: 10, left: 0, top: 0, margin: 0, width: "100%", height: "100%"}, 
        onMouseUp: this.focus
        }, 
        React.DOM.div({className: "messages-container"}, 
          chatInput, 
          React.DOM.div({className: "messages-list"}, 
            nodes
          )
        )
      )
    );
  }
});

module.exports = {
  InteractiveMessageView:InteractiveMessageView,
  LogMessageView:LogMessageView,
  MessagesView:MessagesView,
  UserMessageView:UserMessageView,
};

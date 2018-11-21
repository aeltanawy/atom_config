/** @jsx React.DOM */

"use strict";

const React = require('react-atom-fork');
const floop = require("../common/floop");
const permsEvent = {};

const HandleRequestPermView = React.createClass({displayName: 'HandleRequestPermView',
  destroy: function () {
    this.getDOMNode().parentNode.destroy();
  },
  grant: function () {
    permsEvent.action = "add";
    this.send();
  },
  deny: function () {
    permsEvent.action = "reject";
    this.send();
  },
  send: function () {
    floop.send_perms(permsEvent);
    this.destroy();
  },
  render: function () {
    permsEvent.user_id = this.props.userId;
    permsEvent.perms = this.props.perms;
    return (
      React.DOM.div(null, 
        React.DOM.div({className: "row"}, 
          React.DOM.h2({className: "col-lg-12"}, this.props.username, " wants to edit this workspace")
        ), 
        React.DOM.div({className: "well"}, 
          React.DOM.div({className: "row"}, 
            React.DOM.div({className: "col-lg-12 btn-group"}, 
              React.DOM.button({tabIndex: "0", className: "btn btn-warning", onClick: this.grant}, "Grant Access"), 
              React.DOM.button({tabIndex: "10", className: "btn btn-primary", onClick: this.deny}, "Deny Access"), 
              React.DOM.button({tabIndex: "20", className: "btn btn-default", onClick: this.destroy}, "Ignore")
            )
          )
        )
      )
    );
  }
});

module.exports = HandleRequestPermView;

/** @jsx React.DOM */
"use strict";
"use babel";

const React = require("react-atom-fork");
const mixins = require("./mixins");
const UserlistView = require("./user_view").UserlistView;

const UserlistPane = React.createClass({displayName: 'UserlistPane',
  mixins: [mixins.ReactUnwrapper],
  render: function () {
    return (
      React.DOM.div({id: "user-list-pane"}, 
        React.DOM.div({id: "user-list-pane-header"}, 
          React.DOM.img({src: "atom://floobits/resources/icon_64x64.png"}), "Floobits", 
          React.DOM.i({className: "floobits-close-icon-small", onClick: this.destroy})
        ), 
        UserlistView({users: this.props.users, me: this.props.me, prefs: this.props.prefs})
      )
    );
  }
});

module.exports = UserlistPane;

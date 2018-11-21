/** @jsx React.DOM */
"use strict";
"use babel";

const React = require("react-atom-fork");
const mixins = require("./mixins");
const UserlistView = require("./user_view").UserlistView;

const UserlistPane = React.createClass({
  mixins: [mixins.ReactUnwrapper],
  render: function () {
    return (
      <div id="user-list-pane">
        <div id="user-list-pane-header">
          <img src="atom://floobits/resources/icon_64x64.png" />Floobits
          <i className="floobits-close-icon-small" onClick={this.destroy}></i>
        </div>
        <UserlistView users={this.props.users} me={this.props.me} prefs={this.props.prefs} />
      </div>
    );
  }
});

module.exports = UserlistPane;

/** @jsx React.DOM */

"use strict";

const _ = require("lodash");
const React = require("react-atom-fork");
const $ = require('atom-space-pen-views').$;
const TYPES = ["admin_room", "edit_room", "request_perms", "view_room"];

const EditPermsView = React.createClass({displayName: 'EditPermsView',
  permissions: null,
  getInitialState: function () {
    this.owner = this.props.floourl.owner;
    this.workspace = this.props.floourl.workspace;
    return {
      secret: null,
      is_org: false,
      usernames: [],
      perms: [],
      selectedIndex: -1,
      newUser: null,
      anonUser: null,
      error: null,
    };
  },
  componentWillMount: function () {
    this.loadData();
  },
  loadData: function () {
    this.ajax({
      type: "GET",
      url: this.props.floourl.toAPIString(),
      success: function(data)  {
        if (!this.isMounted()) {
          return;
        }
        let anonUser;
        let perms = [];
        _.map(data.perms, function(permissions, username)  {
          const user = {
            id: username,
            permissions:permissions,
          };
          if (username === "AnonymousUser") {
            anonUser = user;
          } else {
            perms.push(user);
          }
        });
        if (this.refs.editAutocomplete) {
          this.refs.editAutocomplete.getDOMNode().value = "";
          this.refs.new_admin_room.getDOMNode().checked = false;
          this.refs.new_edit_room.getDOMNode().checked = false;
          this.refs.new_request_perms.getDOMNode().checked = false;
          this.refs.new_view_room.getDOMNode().checked = false;
        }
        this.setState({
          selectedIndex: -1,
          usernames: [],
          newUser: null,
          secret: data.secret,
          perms:perms,
          is_org: data.is_org,
          anonUser:anonUser,
          error: null,
        });
      }.bind(this)
    });
  },
  componentDidUpdate: function () {
    const selected = this.refs.selected;
    if (!selected) {
      return;
    }
    let el = selected.getDOMNode();
    if (_.isFunction(el.scrollIntoViewIfNeeded)) {
      el.scrollIntoViewIfNeeded();
    } else {
      el.scrollIntoView();
    }
  },
  close: function () {
    this.getDOMNode().parentNode.destroy();
  },
  save: function () {
    const data = {
      perms: {},
      secret: this.refs.isSecret.getDOMNode().checked,
      name: this.workspace,
      owner: this.owner,
    };
    this.state.perms.forEach(function(user, index)  {
      data.perms[user.id] = TYPES.filter(function(type)  {
        return this.refs["" + index + type].getDOMNode().checked;
      }.bind(this));
    }.bind(this));
    if (this.state.newUser) {
      data.perms[this.state.newUser.user] = TYPES.filter(function(type)  {
        return this.refs["new_" + type].getDOMNode().checked;
      }.bind(this));
    }
    data.perms.AnonymousUser = TYPES.filter(function(type)  {
      if (type === "admin_room") {
        return false;
      }
      return this.refs["anon_" + type].getDOMNode().checked;
    }.bind(this));
    this.ajax({
      type: "put",
      url: this.props.floourl.toAPIString(),
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function()  {
        console.log("success saving permission data", arguments);
        // TODO: this is wasteful. it does another XHR. We could just look at the success response here
        this.loadData();
        this.close();
      }.bind(this),
      error: function(e)  {
        this.setState({
          errors: e.statusText || "Unknown error. :(",
        });
      }.bind(this)
    });
  },
  addSelectedUserFromLi_: function (index) {
    this.addSelectedUser_(index);
  },
  addSelectedUser: function () {
    if (this.state.selectedIndex < 0) {
      this.setState({usernames: []});
      return;
    }
    this.addSelectedUser_(this.state.selectedIndex);
  },
  addSelectedUser_: function (index) {
    var newUser;
    newUser = this.state.usernames[index];
    if (!newUser) {
      this.setState({newUser: null, usernames: [], selectedIndex: -1});
      return;
    }
    this.refs.editAutocomplete.getDOMNode().value = newUser.user;
    this.setState({newUser:newUser, usernames: [], selectedIndex: -1});
    this.refs.new_admin_room.getDOMNode().focus();
  },
  preAutoComplete_: function (event) {
    var tab;
    tab = 9;
    if (event.keyCode === tab && !event.shiftKey) {
      event.preventDefault();
      return;
    }
  },
  autoComplete_: function (event) {
    const up = 38;
    const down = 40;
    const tab = 9;
    const enter = 13;
    const keyCode = event.keyCode;
    let selectedIndex;
    switch (keyCode) {
      case down:
        //move down or up if at the end
        selectedIndex = this.state.selectedIndex + 1;
        if (selectedIndex >= this.state.usernames.length) {
          selectedIndex = 0;
        }
        this.setState({selectedIndex:selectedIndex});
        break;
      case up:
        selectedIndex = this.state.selectedIndex - 1;
        if (selectedIndex < 0) {
          selectedIndex = this.state.usernames.length - 1;
        }
        this.setState({selectedIndex:selectedIndex});
        break;
      case enter:
      case tab:
        this.addSelectedUser();
        break;
      default:
        this.fetchAutoComplete_();
        break;
    }
  },
  ajax: function (data) {
    const auth = this.props.auth;
    data.username = auth.username || auth.api_key;
    data.password = auth.secret;
    $.ajax(data);
  },
  fetchAutoComplete_: function () {
    var value, input = this.refs.editAutocomplete.getDOMNode();
    value = input.value || "";
    value = value.trim();
    if (!value) {
      this.setState({newUser: null, usernames: [], selectedIndex: -1});
      input.value = "";
      return;
    }
    const url = ("https://" + this.props.floourl.host + "/api/autocomplete/json_username/" + value);
    const that = this;
    this.ajax({
      type: "GET",
      url: url,
      success: function (users) {
        if (!(users && users.length && that.isMounted())) {
          return;
        }
        that.setState({"usernames": users, selectedIndex: 0});
      },
      error: function () {
        if (!that.isMounted()) {
          return;
        }
        that.setState({"usernames": [], selectedIndex: -1});
      }
    });
  },
  handlePermissionChange_: function (type, index) {
    const permIndex = TYPES.indexOf(type);
    let refKey = "" + index + type;
    const checked = this.refs[refKey].getDOMNode().checked;
    TYPES.forEach(function(t, i)  {
      if (index === "anon_" && t === "admin_room") {
        return;
      }
      refKey = "" + index + t;
      if (checked && i > permIndex) {
        this.refs[refKey].getDOMNode().checked = true;
      } else if (!checked && i < permIndex) {
        this.refs[refKey].getDOMNode().checked = false;
      }
    }.bind(this));
  },
  getInput: function (index, user, type) {
    const labels = {
      "admin_room": "Admin",
      "edit_room": "Edit",
      "request_perms": "Request permissions",
      "view_room": "View",
    };
    return (
      React.DOM.td({key: index + type}, 
        React.DOM.label(null, labels[type], " ", React.DOM.input({type: "checkbox", className: "perm-cb native-key-bindings", 
          onChange: this.handlePermissionChange_.bind(this, type, index), 
          defaultChecked: user && user.permissions.indexOf(type) !== -1, 
          ref: index + type})
        )
      )
    );
  },
  render: function () {
    return this.renderBody();
  },
  /**
   * @param {Object} event
   * @private
   */
  renderBody: function () {
    if (this.state.secret === null) {
      return (React.DOM.p(null, "Loading"));
    }
    const anonUser = this.state.anonUser;
    const users = this.state.perms.map(function (user, index) {
      var inputs = TYPES.map(function (type) {
        return this.getInput(index, user, type);
      }, this);
      return (
        React.DOM.tr({key: user.id}, 
          React.DOM.td({className: "user-with-perms"}, user.id), 
          inputs
        )
      );
    }, this);
    const usernames = this.state.usernames.map(function (user, index) {
      return (
        React.DOM.li({
          key: user.user + index, 
          onClick: this.addSelectedUserFromLi_.bind(this, index), 
          ref: this.state.selectedIndex === index ? "selected" : ("notSelected" + index), 
          className: this.state.selectedIndex === index ? "selected" : ""}, 
            React.DOM.img({style: {height: 30, width: 30}, 
              src: user.gravatar + "&s=60"}), 
            React.DOM.span({className: "username"}, user.user)
        )
      );
    }, this);
    const newInputs = TYPES.map(this.getInput.bind(this, "new_", null));
    const anonInputs = TYPES.filter(function (type) { return type !== "admin_room"; })
      .map(this.getInput.bind(this, "anon_", anonUser));

    const workspace = this.props.floourl.workspace;
    const owner = this.props.floourl.owner;
    return (
      React.DOM.div({id: "edit-perms-content-wizard", className: "workspace-wizard"}, 
        React.DOM.p({className: "wizard-section no-content"}, React.DOM.strong(null, "Edit Permissions for ", owner, "/", workspace)), 
        React.DOM.div({id: "secret-content", className: "wizard-section"}, 
          React.DOM.label(null, "This workspace is secret ", React.DOM.input({type: "checkbox", id: "secret-workspace", 
            ref: "isSecret", 
            defaultChecked: this.state.secret})), 
            React.DOM.br(null), 
            React.DOM.small(null, "Secret workspaces are unlisted. They count towards private workspaces.")
        ), 
        anonUser &&
        React.DOM.div({id: "all-perms-content", className: "wizard-section"}, 
          "Everyone can:", 
          React.DOM.div({className: "everyone-can"}, 
            React.DOM.table(null, 
              React.DOM.tr(null, 
              anonInputs
              )
            )
          )
        ), 
        
        React.DOM.div({id: "user-perms-content", className: "wizard-section"}, 
          React.DOM.table(null, 
            React.DOM.thead(null, 
              React.DOM.tr(null, 
               React.DOM.th(null, "User"), 
               React.DOM.th({colSpan: "4"}, "Permissions")
              )
            ), 
            React.DOM.tbody(null, 
              users, 
              React.DOM.tr(null, 
                React.DOM.td(null, React.DOM.input({type: "text", ref: "editAutocomplete", className: "edit-autocomplete autocomplete native-key-bindings", 
                  onKeyDown: this.preAutoComplete_, 
                  onKeyUp: this.autoComplete_}), 
                  React.DOM.div({className: "autocomplete-content", style: {display: (usernames.length ? "block" : "none")}}, 
                    React.DOM.div({ref: "autoCompleteResults", 
                      className: "edit-perms-autocomplete-results"}, 
                      React.DOM.ul({className: "autocomplete_results"}, usernames)
                      )
                  )
                ), 
                newInputs
              )
            )
          )
        ), 

        this.state.is_org && (React.DOM.div(null, 
          React.DOM.div(null, 
            React.DOM.a({href: "/" + this.owner + "/members"}, "Add a member to your organization.")
          ), 
          React.DOM.div(null, 
            React.DOM.a({href: "/" + this.owner + "/invite"}, "Invite users to your organization.")
          )
        )), 
        this.state.error && (React.DOM.div({className: "alert alert-danger"}, 
          "Error saving permissions: ", this.state.errors
        )), 
        this.renderFooter()
      )
    );
  },
  renderFooter: function () {
    return (
      React.DOM.div(null, 
        React.DOM.button({className: "btn btn-default btn-danger", onClick: this.save}, "Save"), 
        React.DOM.button({className: "btn btn-default", onClick: this.close}, "Close")
      )
    );
  }
});

module.exports = EditPermsView;

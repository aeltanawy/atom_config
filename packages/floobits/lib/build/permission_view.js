/** @jsx React.DOM */
"use strict";

var React = require('react-atom-fork');
var floop = require("../common/floop");
var mixins = require("./mixins");
var _ = require("lodash");

var PermissionView = React.createClass({displayName: 'PermissionView',
  mixins: [mixins.ReactUnwrapper, mixins.FormMixin],
  getInitialState: function () {
    var permissions;
    permissions = this.props.user.permissions;
    return {
      admin_room: permissions.indexOf("kick") !== -1,
      view_room: permissions.indexOf("get_buf") !== -1,
      edit_room: permissions.indexOf("set_buf") !== -1,
      request_perms: permissions.indexOf("request_perms") !== -1,
    };
  },
  componentDidMount: function () {
    // TODO. this is a bootstrap-ism
    // this.props.user.on("change:connected", modal.killModal);
    return;
  },
  renderField: function (label, name, description) {
    return (
      React.DOM.div({className: "field_wrapper", key: name}, 
        React.DOM.label({htmlFor: "id_" + name}, label), 
        React.DOM.input({onChange: _.bind(this.handleChange_, this, name), ref: name, id: "id_" + name, type: "checkbox", checked: this.state[name]}), 
        React.DOM.div(null, 
          React.DOM.small({className: "text-info"}, description)
        )
      )
    );
  },
    /**
   * @param {Event} event
   * @private
   */
  onSubmit: function (event) {
    var newPerms;
    event.preventDefault();
    newPerms = ["view_room", "edit_room", "request_perms", "admin_room"].filter(function (perm) {
      return this.state[perm];
    }, this);
    floop.send_perms({
      user_id: this.props.user.getConnectionID(),
      perms: newPerms,
      action: "set",
    });
    this.destroy();
  },
  /**
   * @param {string} type
   * @param {Object} event
   * @private
   */
  handleChange_: function (type, event) {
    var index, permissions, state, checked;
    permissions = ["view_room", "request_perms", "edit_room", "admin_room"];
    checked = event.target.checked;
    index = permissions.indexOf(type);
    state = {};

    permissions.forEach(function (perm, i) {
      if (i < index && checked) {
        state[perm] = checked;
      } else if (i > index && !checked) {
        state[perm] = checked;
      } else if (i === index) {
        state[perm] = checked;
      } else {
        state[perm] = this.state[perm];
      }
    }, this);
    this.setState(state);
  },
  render: function () {
    var fields = [
      ["View", "view_room", "view files and terminals in this workspace"],
      ["Request permissions", "request_perms", "ask admins for permission to edit files in this workspace"],
      ["Edit", "edit_room", "edit files in this workspace"],
      ["Administer", "admin_room", "set permissions and type in all terminals"],
    ].map(function (perm) {
      return this.renderField.apply(this, perm);
    }, this);


    return (
      React.DOM.div({className: "well", id: "floobits-permissions"}, 
        React.DOM.h2(null, "Permissions for ", this.props.user.id), 

        React.DOM.form({onSubmit: this.onSubmit, className: "native-key-bindings"}, 
          React.DOM.fieldset(null, 
            fields
          )
        ), 

        React.DOM.div({className: "row"}, 
          React.DOM.div({className: "col-lg-12 pull-right"}, 
            React.DOM.input({tabIndex: "5", ref: "submit", onClick: this.onSubmit, type: "submit", value: "Save", className: "floobits-submit"}), 
            React.DOM.input({tabIndex: "7", ref: "cancel", onClick: this.destroy, type: "submit", value: "Cancel", className: "floobits-submit"})
          )
        )
      )
    );
  }
});

module.exports = PermissionView;


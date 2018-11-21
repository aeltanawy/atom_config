/** @jsx React.DOM */

"use strict";
"use babel";

const async = require("async");
const _ = require("lodash");
const React = require('react-atom-fork');
const open_url = require("open");
const floorc = require("../common/floorc");
const api = require("../common/api");
const constants = require("../common/constants");
const mixins = require("./mixins");

const CreateWorkspaceView = React.createClass({displayName: 'CreateWorkspaceView',
  mixins: [mixins.ReactUnwrapper, mixins.FormMixin],
  getInitialState: function () {
    return {
      error: "",
      name: "",
      create: true,
      hosts: {},
      host: "",
      disabled_hosts: {},
      owner: "",
      // perms
      view: true,
      edit: false,
      needsMonies: false
    };
  },
  componentWillMount: function () {
    if (!this.props.dir) {
      console.error("can't create a workspace without an open directory in atom");
      return this.destroy();
    }
    const state = this.state;
    state.name = this.props.dir.getBaseName();
    if (_.has(floorc.auth, constants.HOST)) {
      state.host = constants.HOST;
      state.owner = floorc.auth[constants.HOST].username;
    } else {
      state.host = _.keys(floorc.auth)[0];
      state.owner = floorc.auth[state.host].username;
    }

    _.each(floorc.auth, function (auth, host) {
      state.hosts[host] = [auth.username];
    });

    this.setState(state);

    const that = this;
    async.each(_.keys(floorc.auth), function (host, cb) {
      api.get_orgs_can_admin(host, function (err, res, body) {
        const hosts = that.state.hosts;
        if (err) {
          that.state.disabled_hosts[host] = true;
          that.setState(that.state);
          console.error(err);
        } else {
          _.each(body, function (org) {
            hosts[host].push(org.name);
          });
          that.setState(hosts);
        }
        return cb();
      });
    }, function (err) {
      if (err) {
        console.error(err);
      }

      const name = that.refs.name.getDOMNode();
      const length = name.value.length;
      name.setSelectionRange(length, length);
      name.focus();
    });
  },
  join: function (url, created) {
    const path = this.props.dir.getPath();
    process.nextTick(function () {
      require("../floobits").join_workspace_(path, url, created);
    });
    this.destroy();
  },
  onSubmit: function (event) {
    event.preventDefault();
    const create = this.refs.create ? this.refs.create.getDOMNode().checked : true;
    if (!create) {
      this.join(this.props.url);
      return;
    }
    const edit = this.refs.edit.getDOMNode().checked;
    const view = this.refs.view.getDOMNode().checked;
    const perms = [];
    if (edit) {
      perms.push("edit_room");
      perms.push("view_room");
    }
    if (view) {
      perms.push("view_room");
    }
    const name = this.refs.name.getDOMNode().value;
    const host = this.state.host;
    const owner = this.state.owner;
    const room_perms = {AnonymousUser: perms};
    api.create_workspace(host, name, owner, room_perms, function (err, res, body) {
      if (err) {
        atom.confirm({
          message: "Could not Create Workspace",
          detailedMessage: err.toString(),
          buttons: {"OK": function () {}}
        });
        console.error(err, res, body);
        return;
      }

      console.log(err, res, body);
      const code = res.statusCode;

      if (code < 400) {
        const workspace = ("http://" + host + "/" + owner + "/" + name);
        console.log("created workspace", workspace);
        this.join(workspace, true);
        return;
      }
      console.error('Unable to create workspace: ', code, body);

      switch (code) {
        case 400:
          this.setState({
            needsMonies: false,
            name: name.replace(/[^A-Za-z0-9_\-\.]/g, "-"),
            error: "Workspace names may only contain [A-Za-z0-9_\-\.]."
          });
          return;
        case 402:
          this.setState({needsMonies: true, error: false});
          return;
        case 409:
          this.setState({
            error: "A workspace with that name already exists.",
            needsMonies: false,
            name: this.state.name + "1"}
          );
          return;
        default:
          this.setState({
            needsMonies: false,
            error: ("Could not create workspace " + code + ": " + body)
          });
          return;
      }
    }.bind(this));
  },
  toggleCreate: function (event) {
    this.setState({create: event.target.checked});
  },
  onNameChange: function (event) {
    this.setState({name: event.target.value});
  },
  onSelectAuth: function (event) {
    this.setState({host: event.target.value});
  },
  render_auth: function () {
    const auths = _.keys(this.state.hosts);
    if (auths.length === 0) {
      return (React.DOM.div(null));
    }
    if (auths.length === 1 && auths[0] === constants.HOST) {
      return (React.DOM.div(null, auths[0]));
    }
    auths.sort(function (a, b) {
      if (a === constants.HOST) {
        return -1;
      }
      if (b === constants.HOST) {
        return 1;
      }
      if (a === b) {
        return 0;
      } else if (a < b) {
        return -1;
      }
      return 1;
    });
    const that = this;
    return (
      React.DOM.div({className: "form-group"}, 
        React.DOM.label({className: "col-sm-3 control-label", id: "floobits-host"}, "Host"), 
        React.DOM.div({className: "col-sm-9"}, 
          auths.map(function (host) {
            const disabled = that.state.disabled_hosts[host];
            return (
              React.DOM.label({className: "radio-inline native-key-bindings", key: host}, 
                React.DOM.input({onChange: that.onSelectAuth, type: "radio", name: "host", value: host, tabIndex: "3", 
                  disabled: disabled, checked: host === that.state.host, className: "native-key-bindings"}), " ", host
              )
            );
          })
        )
      )
    );
  },
  onChangedOwner: function (event) {
    this.setState({owner: event.target.value});
  },
  onChangeView: function (event) {
    const state = {view: event.target.checked};
    if (!state.view) {
      state.edit = false;
    }
    this.setState(state);
  },
  onChangeEdit: function (event) {
    const state = {edit: event.target.checked};
    if (state.edit) {
      state.view = true;
    }
    this.setState(state);
  },
  render_create: function () {
    const owners = this.state.hosts[this.state.host];

    let username = floorc.auth[this.state.host];
    username = username && username.username;

    owners.sort(function (a, b) {
      if (a === username) {
        return -1;
      }
      if (b === username) {
        return 1;
      }
      if (a === b) {
        return 0;
      } else if (a < b) {
        return -1;
      }
      return 1;
    });
    const that = this;
    const labels = owners.map(function (o) {
      return (
        React.DOM.label({className: "radio-inline native-key-bindings", key: o}, 
          React.DOM.input({type: "radio", onChange: that.onChangedOwner, name: "owner", tabIndex: "5", 
            value: o, className: "native-key-bindings", checked: o === that.state.owner}), " ", o
        )
      );
    });
    return (
      React.DOM.div(null, 
        this.render_auth(), 
        React.DOM.div({className: "form-group"}, 
          React.DOM.label({className: "col-sm-3 control-label"}, "Owner"), 
          React.DOM.div({className: "col-sm-9"}, 
            labels
          )
        ), 
        React.DOM.div({className: "form-group"}, 
          React.DOM.label({htmlFor: "floobits-name", className: "col-sm-3 control-label"}, "Name"), 
          React.DOM.div({className: "col-sm-9"}, 
            React.DOM.input({tabIndex: "7", id: "floobits-name", ref: "name", className: "native-key-bindings form-control", type: "text", value: this.state.name, onChange: this.onNameChange})
          )
        ), 
        React.DOM.div({className: "form-group"}, 
          React.DOM.label({htmlFor: "floobits-description", className: "col-sm-3 control-label"}, "Description"), 
          React.DOM.div({className: "col-sm-9"}, 
            React.DOM.textarea({tabIndex: "9", id: "floobits-description", ref: "description", className: "native-key-bindings form-control", type: "text", rows: "3"})
          )
        ), 
        React.DOM.div({className: "form-group alert alert-info"}, 
          React.DOM.label({className: "col-sm-3 control-label"}, "Global Permissions"), 
          React.DOM.div({className: "col-sm-9"}, 
            React.DOM.label({className: "native-key-bindings checkbox-inline"}, 
              React.DOM.input({tabIndex: "11", checked: this.state.view, onChange: this.onChangeView, type: "checkbox", ref: "view", value: "view", className: "native-key-bindings"}), " Viewable"
            ), 
            React.DOM.label({className: "native-key-bindings checkbox-inline"}, 
              React.DOM.input({tabIndex: "13", checked: this.state.edit, type: "checkbox", ref: "edit", value: "edit", onChange: this.onChangeEdit, className: "native-key-bindings"}), " Editable"
            )
          )
        )
      )
    );
  },
  render_create_new_workspace_option: function () {
    const url = this.props.url;
    if (!url) {
      return undefined;
    }
    return (
      React.DOM.div(null, 
        React.DOM.div({className: "form-group"}, 
          React.DOM.div({className: "col-sm-offset-3 col-sm-9"}, 
            React.DOM.p(null, 
              "The workspace ", url, " already exists.  Do you want to create a new workspace?"
            ), 
            React.DOM.div({className: "checkbox"}, 
              React.DOM.label(null, 
                React.DOM.input({id: "floobits-create", ref: "create", type: "checkbox", tabIndex: "1", 
                  onChange: this.toggleCreate, checked: this.state.create, className: "native-key-bindings"}), " Create New Workspace"
              )
            )
          )
        )
      )
    );
  },
  openBilling: function (event) {
    event.preventDefault();
    open_url(("https://" + this.state.host + "/" + this.state.owner + "/settings#billing"));
  },
  render: function () {
    return (
      React.DOM.div({className: "floobits"}, 
        React.DOM.h2({style: {textAlign: "center"}}, "Create Workspace"), 
        React.DOM.div({className: "well"}, 
          React.DOM.form({id: "join-workspace", className: "form-horizontal native-key-bindings", onSubmit: this.onSubmit}, 
            this.render_create_new_workspace_option(), 
            this.state.create && this.render_create(), 
            !this.state.error ? "" :
              React.DOM.div({className: "alert alert-danger", role: "alert"}, 
                React.DOM.strong(null, this.state.error)
              ), 
            
            !this.state.needsMonies ? "" :
              React.DOM.div({className: "alert alert-danger", role: "alert"}, 
                "You reached the ", React.DOM.a({onClick: this.openBilling}, "limit for workspaces"), " for ", this.state.host, "/", this.state.owner, "."
              ), 
            
            React.DOM.div({className: "col-sm-offset-3 col-sm-9"}, 
              React.DOM.input({tabIndex: "14", type: "submit", value: this.state.create ? "Create Workspace" : "Join Workspace", className: "floobits-submit"}), 
              React.DOM.input({tabIndex: "15", type: "submit", value: "Cancel", className: "floobits-submit", onClick: this.destroy})
            )
          )
        )
      )
    );
  }
});

module.exports = CreateWorkspaceView;

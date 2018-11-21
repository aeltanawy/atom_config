/** @jsx React.DOM */

"use strict";

const $ = require('atom-space-pen-views').$;
const React = require('react-atom-fork');
const utils = require("../common/utils");
const mixins = require("./mixins");

const JoinWorkspace = React.createClass({displayName: 'JoinWorkspace',
  mixins: [mixins.ReactUnwrapper, mixins.FormMixin],
  getInitialState: function () {
    return {
      path: this.props.path,
      url: this.props.url,
    };
  },
  onSubmit: function (event) {
    if (event) {
      event.preventDefault();
    }
    setTimeout(function () {
      this.props.on_url(this.state.path, this.refs.url.getDOMNode().value);
    }.bind(this), 0);
    this.destroy();
  },
  onChange_: function (event) {
    const files = event.target.files;
    if (!files.length) {
      return;
    }
    const path = files[0].path;
    const state = {path: path};
    if (this.refs.url.getDOMNode().value === this.props.url) {
      const dotFloo = utils.load_floo(path);
      if (dotFloo.url && dotFloo.url.length) {
        state.url = dotFloo.url;
      }
    }
    this.setState(state);
  },
  onDidStuff: function () {
    if (this.state.path) {
      return;
    }
    $("#ultra-secret-hidden-file-input").attr("webkitdirectory", true);
  },
  componentDidUpdate: function () {
    this.onDidStuff();
  },
  componentDidMount: function () {
    this.onDidStuff();

    const that = this;
    setTimeout(function () {
      const url = that.refs.url.getDOMNode();
      const length = url.value.length;
      url.setSelectionRange(length, length);
      url.focus();
    }, 0);

  },
  onTyping: function (event) {
    const path = event.target.value;
    if (path === this.state.path) {
      return;
    }
    this.setState({path: path});
  },
  focusFileInput: function () {
    if (this.state.path) {
      return;
    }
    $("#ultra-secret-hidden-file-input").trigger('click');
    this.setState({showMessage: true});
  },
  updateURL: function (e) {
    this.setState({url: e.target.value});
  },
  render: function () {
    return (
      React.DOM.div({style: {overflow: "auto"}}, 
        React.DOM.h2(null, "Join Workspace"), 
        React.DOM.div({className: "well"}, 
          React.DOM.form({id: "join-workspace", onSubmit: this.onSubmit, className: "native-key-bindings"}, 
            React.DOM.input({id: "ultra-secret-hidden-file-input", type: "file", ref: "dir", style: {display: "none"}, onChange: this.onChange_}), 

            React.DOM.div({className: "row"}, 
              React.DOM.div({className: "col-lg-12"}, 
                React.DOM.div({className: "input-group"}, 
                  React.DOM.span({className: "input-group-addon", id: "url-addon"}, "URL"), 
                  React.DOM.input({tabIndex: "1", id: "floobits-url", ref: "url", className: "native-key-bindings form-control", onChange: this.updateURL, value: this.state.url, 'aria-describedby': "url-addon"})
                )
              )
            ), 

            React.DOM.div({className: "row"}, 
              React.DOM.div({className: "col-lg-12"}, 
                React.DOM.div({className: "input-group"}, 
                  React.DOM.span({onClick: this.focusFileInput, style: {cursor: "pointer"}, className: "input-group-addon", id: "directory-addon", disabled: this.props.dir}, "Select Directory"), 
                  React.DOM.input({tabIndex: "3", onFocus: this.focusFileInput, onChange: this.onTyping, disabled: this.props.path, type: "text", className: "native-key-bindings form-control", placeholder: "...", 
                    'aria-describedby': "directory-addon", value: this.state.path, ref: "dir"})
                )
              )
            ), 

             this.props.path &&
              React.DOM.div({className: "row"}, 
                React.DOM.div({className: "col-lg-12 pull-right"}, 
                  React.DOM.p({className: "alert alert-info"}, 
                    "Atom's API for managing windows is ", React.DOM.a({style: {color: "black"}, href: "https://github.com/atom/atom/issues/5138"}, "currently broken"), ".  If you'd like to open the workspace in a different window," + ' ' +
                    "please open the window and then call floobits::join/create in that window."
                  )
                )
              ), 
            
            React.DOM.div({className: "row"}, 
              React.DOM.div({className: "col-lg-12 pull-right"}, 
                React.DOM.input({tabIndex: "5", ref: "submit", onClick: this.onSubmit, type: "submit", value: "Join", className: "floobits-submit"}), 
                React.DOM.input({tabIndex: "7", ref: "cancel", onClick: this.destroy, type: "submit", value: "Cancel", className: "floobits-submit"})
              )
            )
          )
        )
      )
    );
  }
});

module.exports = JoinWorkspace;

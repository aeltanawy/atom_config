/** @jsx React.DOM */

"use strict";

const React = require('react-atom-fork');
const mixins = require("./mixins");
const atomUtils = require("../atom_utils");

const CodeReview = React.createClass({displayName: 'CodeReview',
  mixins: [mixins.ReactUnwrapper, mixins.FormMixin],
  onSubmit: function (state) {
    const cb = this.props.cb.bind({}, null, state, this.refs.description.getDOMNode().value);
    setTimeout(cb, 0);
    this.destroy();
  },
  componentDidMount: function () {
    this.refs.description.getDOMNode().focus();
  },
  render: function () {
    return (
      React.DOM.form(null, 
        React.DOM.h2({style: {textAlign: "center"}}, "Code Review"), 
        React.DOM.div({className: "well"}, 
          React.DOM.div({className: "row"}, 
            React.DOM.div({className: "col-md-12"}, 
              "Please describe your problem.  A human will look at your code and try to help you.", 
              React.DOM.textarea({className: "native-key-bindings", ref: "description", rows: 3, style: {width: "100%", height: "100%", color: "black"}}
              )
            )
          ), 

          React.DOM.div({className: "row"}, 
            React.DOM.div({className: "col-md-6"}), 
            React.DOM.div({className: "col-md-6", style: {textAlign: "right"}}, 
              React.DOM.button({tabIndex: "5", className: "btn btn-default", name: "cancel", onClick: this.onSubmit.bind(this, false)}, "cancel"), 
              " ", 
              React.DOM.button({tabIndex: "7", className: "btn btn-primary", name: "yes", onClick: this.onSubmit.bind(this, true), ref: "yes"}, "OK")
            )
          )
        )
      )
    );
  }
});

module.exports = function (cb) {
  const view = CodeReview({cb: cb});
  atomUtils.addModalPanel('code-review', view);
};
/** @jsx React.DOM */

"use strict";

const React = require('react-atom-fork');
const mixins = require("./mixins");
const atomUtils = require("../atom_utils");

const YesNoCancel = React.createClass({displayName: 'YesNoCancel',
  mixins: [mixins.ReactUnwrapper, mixins.FormMixin],
  onSubmit: function (type) {
    if (!type) {
      type = "yes";
    } else if (type.target) {
      type = type.target.name;
    }
    const cb = this.props.cb.bind({}, null, type);
    setTimeout(cb, 0);
    this.destroy();
  },
  componentDidMount: function () {
    this.refs.yes.getDOMNode().focus();
  },
  render: function () {
    const yes = this.props.yes || "Yes";
    const no = this.props.no || "No";
    const cancel = this.props.cancel || "Cancel";
    return (
      React.DOM.form(null, 
        React.DOM.h2({style: {textAlign: "center"}}, this.props.title), 
        React.DOM.div({className: "well"}, 
          React.DOM.div({className: "row"}, 
            React.DOM.div({className: "col-md-12"}, 
              React.DOM.p(null, 
                this.props.body
              )
            )
          ), 

          React.DOM.div({className: "row"}, 
            React.DOM.div({className: "col-md-6"}, 
              React.DOM.button({tabIndex: "4", className: "btn btn-default", name: "no", onClick: this.onSubmit.bind(this, "no")}, no)
            ), 
            React.DOM.div({className: "col-md-6", style: {textAlign: "right"}}, 
              React.DOM.button({tabIndex: "5", className: "btn btn-default", name: "cancel", onClick: this.onSubmit.bind(this, "cancel")}, cancel), 
              " ", 
              React.DOM.button({tabIndex: "7", className: "btn btn-primary", name: "yes", onClick: this.onSubmit.bind(this, "yes"), ref: "yes"}, yes)
            )
          )
        )
      )
    );
  }
});

module.exports = function (title, body, opts, cb) {
  if (!cb) {
    cb = opts;
    opts = {};
  }

  opts.title = title;
  opts.body = body;
  opts.cb = cb;

  const view = YesNoCancel(opts);
  atomUtils.addModalPanel('yes-no-cancel', view);
};
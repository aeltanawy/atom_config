/** @jsx React.DOM */
/*global fl */
"use strict";
const fs = require("fs");
const path = require("path");

const _ = require("lodash");
const $ = require('atom-space-pen-views').$;
const React = require('react-atom-fork');

const floop = require("../common/floop");
const utils = require("../common/utils");

module.exports = React.createClass({displayName: 'exports',
  treeize_: function (obj) {
    let node = {};
    let tree = {};
    _.each(obj, function (p) {
      node = tree;
      p.split(path.sep).forEach(function (p) {
        if (p in node) {
          node = node[p];
          return;
        }
        node[p] = {};
        node = node[p];
      });
    });
    return tree;
  },
  getInitialState: function () {
    return {
      enabled: true,
      clicked: "",
      totalFiles: _.size(this.props.different) + _.size(this.props.newFiles) + _.size(this.props.missing),
      missing: new Set(),
      different: new Set(),
      newFiles: new Set(),
    };
  },
  componentDidMount: function () {
    if (this.props.justUpload) {
      const upload = this.remote_;
      setTimeout(function () {
        upload();
      }, 0);
    }

    const local = this.refs.local;
    if (!local) {
      return;
    }
    $(local.getDOMNode()).focus();
  },
  onClick: function (id) {
    console.log(id);
  },
  remote_: function () {
    this.setState({enabled: false});
    _.each(this.props.different, function(b, id)  {
      let encoding = b.encoding || "utf8";
      floop.send_set_buf({
        id:id, encoding:encoding,
        buf: b.txt.toString(encoding),
        md5: b.md5,
      }, null, function(err)  {
        if (!err) {
          this.setState({different: this.state.different.add(id)});
          floop.send_saved({id: id});
        }
      }.bind(this));
    }.bind(this));

    _.each(this.props.missing, function(b, id)  {
      floop.send_delete_buf({id:id}, null, function()  {
        // TODO: check err
        this.setState({missing: this.state.missing.add(id)});
      }.bind(this));
    }.bind(this));

    _.each(this.props.newFiles, function(b, rel)  {
      fs.readFile(b.path, function(err, data)  {
        if (err) {
          console.log(err);
          return;
        }

        const encoding = utils.is_binary(data, data.length) ? "base64" : "utf8";
        floop.send_create_buf({
          path: rel,
          buf: data.toString(encoding),
          encoding: encoding,
          md5: utils.md5(data),
        }, null, function()  {
          this.setState({newFiles: this.state.newFiles.add(rel)});
        }.bind(this));
      }.bind(this));
    }.bind(this));
    this.props.onHandledConflicts({});
  },
  local_: function () {
    this.setState({
      enabled: false,
      newFiles: new Set(_.keys(this.props.newFiles)),
    });
    _.each(this.props.missing, function(b, id)  {
      floop.send_get_buf(id, function()  {return this.setState({missing: this.state.missing.add(id)});}.bind(this));
    }.bind(this));
    _.each(this.props.different, function(b, id)  {
      floop.send_get_buf(id, function()  {return this.setState({different: this.state.different.add(id)});}.bind(this));
    }.bind(this));
    const toFetch = _.merge({}, this.props.missing, this.props.different);
    this.props.onHandledConflicts(toFetch);
  },
  cancel_: function () {
    this.setState({enabled: false});
    require("../floobits").leave_workspace();
  },
  render_: function (title, name) {
    const items = this.props[name];
    const completed = this.state[name];
    if (!_.size(items)) {
      return "";
    }
    return (
      React.DOM.div(null, 
        React.DOM.h3(null, title), 
        React.DOM.ol(null, 
          
            _.map(items, function(b, id)  {
              const path = b.path;
              const checked = completed.has(id) ? "✓" : "";
              return (React.DOM.li({key: id, onClick: this.onClick.bind(this, id, path)}, path, "  ", checked));
            }.bind(this))
          
        )
      )
    );
  },
  render_progress: function () {
    if (this.state.enabled) {
      return false;
    }
    const state = this.state;
    const width = parseInt((state.different.size + state.newFiles.size + state.missing.size) / state.totalFiles * 100, 10);
    const progressWidth = (width + "%");
    return (
      React.DOM.div(null, 
        React.DOM.div({className: "fl-progress"}, 
          React.DOM.span({className: "fl-progress-text"}, progressWidth), 
          React.DOM.div({className: "fl-progress-bar", style: {width: progressWidth}, role: "progressbar"})
        ), 
        React.DOM.p({className: "alert alert-info", style: {marginBottom: 0, visibility: width === 100 ? "visible" : "hidden"}}, 
          "All done syncing files!"
        )
      )
    );
  },
  render_created_workspace: function () {
    const newFiles = this.render_("Uploading:", "newFiles");
    const progress = this.render_progress();
    return (React.DOM.div(null, 
      React.DOM.h1({className: "native-key-bindings"}, "Created ", fl.floourl ? fl.floourl.toString() : "the workspace"), 
      progress, 
      newFiles 
    ));
  },
  render_conflicts: function () {
    const missing = this.render_("Missing", "missing");
    const different = this.render_("Different", "different");
    const newFiles = this.render_("New", "newFiles");
    const ignored = _.map(this.props.ignored, function (p) {
      return React.DOM.li({key: p}, p);
    });

    const tooBig = _.map(this.props.tooBig, function (size, p) {
      return React.DOM.li({key: p}, p, " ", utils.formatBytes(size));
    });

    const state = this.state;
    const progress = this.render_progress();

    return (React.DOM.div(null, 
      React.DOM.h1(null, "Your local files are different from the workspace."), 
      React.DOM.button({className: "btn btn-primary", disabled: !state.enabled, onClick: this.remote_}, "Overwrite Remote Files"), 
      React.DOM.button({className: "btn btn-primary", disabled: !state.enabled, onClick: this.local_, ref: "local"}, "Overwrite Local Files"), 
      React.DOM.button({className: "btn btn-default", disabled: !state.enabled, onClick: this.cancel_}, "Cancel"), 

      progress, 

      missing, 
      different, 
      newFiles, 
      !this.props.ignored.length ? "" :
        React.DOM.div({className: ""}, 
          React.DOM.h3(null, "Ignored"), 
          React.DOM.ol(null, 
            ignored 
          )
        ), 
      
      !tooBig.length ? "" :
        React.DOM.div({className: ""}, 
          React.DOM.h3(null, "Too Big"), 
          React.DOM.ol(null, 
            tooBig 
          )
        )
      
    ));
  },
  render: function () {
    const body = this.props.justUpload ? this.render_created_workspace() : this.render_conflicts();
    return (
      React.DOM.div({className: "native-key-bindings", style: {overflow: "auto", border: 0, padding: 10, left: 0, top: 0, margin: 0, width: "100%", height: "100%"}}, 
        body
      )
    );
  }
});

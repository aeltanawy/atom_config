"use strict";

const $$ = require("atom-space-pen-views").$$;
const _ = require("lodash");

const utils = require("./common/utils");
const PersistentJson = require("./common/persistentjson");
const SelectListView = require("./select_list_view");

function RecentWorkspaceView () {
  SelectListView.call(this);
}

utils.inherits(RecentWorkspaceView, SelectListView);

RecentWorkspaceView.prototype.initialize = function () {
  SelectListView.prototype.initialize.apply(this, arguments);

  this.addClass("overlay from-top");
  const pj = new PersistentJson().load();
  const recent_workspaces = _.pluck(pj.recent_workspaces, "url");
  this.items_ = {};
  const items = recent_workspaces.map((workspace) => {
    const stuff = utils.parse_url(workspace);
    let p;
    try{
      p = pj.workspaces[stuff.owner][stuff.workspace].path;
    } catch(e) {
      p = "?";
    }
    this.items_[p] = workspace;
    return p;
  });
  this.setItems(items);
};

RecentWorkspaceView.prototype.viewForItem = function (path) {
  const items = this.items_;
  return $$(function () {
    const that = this;
    this.li({"class": "two-lines"}, function () {
      that.div({"class": "primary-line file icon icon-file-text"}, path);
      that.div({"class": "secondary-line path no-icon"}, items[path]);
    });
  });
};

RecentWorkspaceView.prototype.confirmed = function (path) {
  // if (d && d.getRealPathSync() === path) {
  //   return require("./floobits").join_workspace(this.items_[path]);
  // }

  atom.config.set("floobits.atoms-api-sucks-url", this.items_[path]);
  atom.config.set("floobits.atoms-api-sucks-path", path);
  atom.open({pathsToOpen: [path], newWindow: true});
};

exports.RecentWorkspaceView = RecentWorkspaceView;

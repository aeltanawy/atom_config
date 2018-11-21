/** @jsx React.DOM */
/*global  */
/** @fileOverview The UI for the userlist. */
"use strict";

const React = require("react-atom-fork");
const flux = require("flukes");
const $ = require("atom-space-pen-views").$;

const modal = require("../modal");
const PermissionView = require("./permission_view");
const perms = require("../common/permission_model");
const editorAction = require("../common/editor_action");
const webrtcAction = require("../common/webrtc_action");
const utils = require("../common/utils");


// const ANONYMOUS_PNG = "/static/images/anonymous.png";
const ANONYMOUS_PNG = "atom://floobits/resources/anonymous.png";


const Connection = React.createClass({displayName: 'Connection',
  componentName: "Connection",
  getInitialState: function () {
    return {
      showPopover: false,
    };
  },
  kick_: function () {
    editorAction.kick(this.props.connection.id);
  },
  render: function () {
    var connection = this.props.connection;

    return (
      React.DOM.div({className: "user-conn"}, 
        React.DOM.span({className: "user-client-name"}, connection.isMe ? "me" : connection.client), 
        React.DOM.span({className: "pull-right"}, connection.path), 
         this.props.isAdmin &&
          React.DOM.span({className: "btn-group pull-right", onClick: this.kick_}, 
           React.DOM.a({href: "#"}, React.DOM.i({className: "floobits-eject-icon"}), " Kick")
          )
        
      )
    );
  }
});

const NotMeUserView = React.createClass({displayName: 'NotMeUserView',
  kick_: function () {
    this.props.user.kick();
  },
  editPerms_: function () {
    var view = PermissionView({user: this.props.user, me: this.props.me});
    modal.showView(view);
  },
  followUser_: function () {
    editorAction.follow(this.props.user.id);
  },
  render: function () {
    var isAdmin = this.props.isAdmin;
    return (
      React.DOM.div(null, 
        React.DOM.span({className: "user-client-name"}, this.props.user.id), 
        React.DOM.span({className: "pull-right"}, 
          React.DOM.a({target: "_blank", href: "/" + this.props.user.id + "/"}, React.DOM.i({className: "floobits-info-icon"}), " Info")
        ), 
        isAdmin &&
          React.DOM.div({onClick: this.kick_, className: "pull-right", style: {clear: "both"}}, 
            React.DOM.a({href: "#"}, React.DOM.i({className: "floobits-eject-icon"}), " Kick")
          ), 
        
        !this.props.isListView &&
        React.DOM.div({onClick: this.followUser_, className: "pull-right", style: {clear: "both"}}, 
          React.DOM.a({href: "#"}, React.DOM.i({className: "floobits-follow-icon"}), " ", this.props.isFollowing ? "Unfollow" : "Follow")
        ), 
        
        isAdmin &&
          React.DOM.div({onClick: this.editPerms_, className: "pull-right", style: {clear: "both"}}, 
            React.DOM.a({href: "#"}, React.DOM.i({className: "floobits-permissions-icon"}), " Permissions")
          )
        
      )
    );
  },
});

const UserView = {
  mixins: [flux.createAutoBinder(['prefs'])],
  getInitialState: function () {
    return {
      opened: false
    };
  },
  followUser_: function () {
    editorAction.follow(this.props.user.id);
  },
  settingsClick: function () {
    $(this.refs.user.getDOMNode()).toggleClass("opened");
    this.state.opened = !!this.state.opened;
  },
  render: function UserViewMixin() {
    const user = this.props.user;
    const me = this.props.me;
    const isAdmin = me.isAdmin;
    const isListView = this.props.isListView;
    let connectionNodes = [];
    let inVideoChat = false;
    user.connections.forEach(function (connection) {
      if (!inVideoChat && connection.inVideoChat) {
        inVideoChat = true;
      }
      if (!connection.connected) {
        return;
      }
      connectionNodes.push(Connection({connection: connection, key: connection.id, 
        me: me, username: user.username, isListView: this.props.isListView, isAdmin: isAdmin}));
    }, this);

    const isFollowing = this.props.prefs.followUsers.indexOf(user.id) !== -1;

    return (
      React.DOM.div({ref: "user", className: "user" + (this.state.opened ? " opened" : "")}, 
        React.DOM.div(null, 
          !this.props.isListView &&
            React.DOM.i({title: isFollowing ? ("Stop following " + user.id) : ("Follow " + user.id + "'s changes"), 
               className: "glyphicon user-indicator user-following" + (isFollowing ? " enabled" : ""), 
               onClick: this.followUser_}), 
          
          inVideoChat &&
            React.DOM.i({title: user.id + " is in video chat", 
              className: "glyphicon user-indicator in-video"}), 
          
          this.body()
        ), 
        React.DOM.div({ref: "settings", className: "user-info"}, 
          React.DOM.div({className: "stack-up"}, 
            React.DOM.div({className: "stack-up-content"}, connectionNodes.length, " connection", connectionNodes.length === 1 ? "" : "s"), 
            React.DOM.hr(null), 
            React.DOM.div({className: "stack-up-content"}, 
              connectionNodes
            ), 
            React.DOM.hr(null), 
            !this.props.connection.isMe &&
              React.DOM.div(null, 
                React.DOM.div({className: "stack-up-content"}, 
                  NotMeUserView({user: user, isAdmin: isAdmin, isListView: isListView, isFollowing: isFollowing})
                ), 
                React.DOM.hr({style: {clear: "both"}})
              )
             
          )
        ), 
        React.DOM.div({className: "user-bar", onClick: this.settingsClick}, 
          React.DOM.span({className: "user-color-square highlight_" + user.color, style: {backgroundColor: user.color}}), 
          React.DOM.span({className: "user-username"}, user.id), 
          React.DOM.i({className: "user-arrow", style: {position: "absolute", top: 5, right: 5}})
        )
      )
    );
  }
};

const GravatarThumbnailView = React.createClass({displayName: 'GravatarThumbnailView',
  mixins: [UserView],
  onClick: function () {
    webrtcAction.start_video_chat(this.props.connection.id);
  },
  body: function () {
    var canEdit = perms.indexOf("patch") !== -1,
      src = this.props.user.gravatar;

    if (src) {
      src += "&s=228";
    } else {
      // No gravatar. Use placeholder.
      src = ANONYMOUS_PNG;
    }
    return (
      React.DOM.img({src: src, className: "user-thumb", title: canEdit ? "Start video chat" : null, onClick: this.onClick})
    );
  }
});

const ImageThumbnailView = React.createClass({displayName: 'ImageThumbnailView',
  mixins: [UserView],
  render_image: function () {
    this.refs.mugshot.getDOMNode().setAttribute("src", this.props.connection.image.data);
  },
  componentDidMount: function () {
    this.render_image();
  },
  componentDidUpdate: function () {
    this.render_image();
  },
  onClick: function () {
    webrtcAction.start_video_chat(this.props.connection.id);
  },
  body: function () {
    var conn = this.props.connection,
      canEdit = perms.indexOf("patch") !== -1,
      clickToVideo = "",
      everyone = "";

    if (canEdit) {
      if (conn.isMe) {
        everyone = (React.DOM.div(null, "with everyone"));
      }
      clickToVideo = (
        React.DOM.div({className: "click-to-video"}, 
          React.DOM.i({className: "glyphicon glyphicon-facetime-video"}), " " + ' ' +
          "Start video chat ", everyone
        )
      );
    }

    return (
      React.DOM.div({className: "user-face", onClick: this.onClick}, 
        React.DOM.img({
          ref: "mugshot", 
          className: "user-thumb" + (conn.isMe ? " user-my-conn" : ""), 
          style: {width: conn.image.width, height: conn.image.height}, 
          title: canEdit ? "Start video chat" : null, 
          src: conn.image.data}), 
        clickToVideo
      )
    );
  }
});

const VideoThumbnailView = React.createClass({displayName: 'VideoThumbnailView',
  mixins: [UserView],
  componentDidMount: function () {
    const n = this.refs.volume.getDOMNode();
    this.id = this.props.connection.visualizer.onVISUALIZE(function (volume) {
      n.style.height = volume + "px";
      n.style.width = volume + "px";
      if (this.state.noMic && volume) {
        this.setState({noMic: false});
      }
    }, this);
  },
  componentWillUnmount: function () {
    const elem = this.refs["user-thumb-" + this.props.connection.id].getDOMNode();

    this.props.connection.visualizer.off(this.id);

    // TODO: chrome has a bug that causes thumbnails to be position: static after full-screening
    if (utils.getFullscreenElement() === elem) {
      console.log("exiting full screen before unmounting");
      utils.exitFullscreen();
    }
  },
  onClick: function () {
    var elem = this.refs["user-thumb-" + this.props.connection.id].getDOMNode(),
      fullscreenElement = utils.getFullscreenElement();

    if (fullscreenElement === elem) {
      utils.exitFullscreen();
      return;
    }
    utils.requestFullscreen(elem);
  },
  stop: function () {
    if (this.props.screenShare) {
      return webrtcAction.stop_screen(this.props.connection.id);
    }
    if (this.props.connection.audioOnly) {
      webrtcAction.stop_audio_chat(this.props.connection.id);
    } else {
      webrtcAction.stop_video_chat(this.props.connection.id);
    }
  },
  body: function () {
    const classNames = ["user-thumb"];

    if (this.props.connection.isMe && !this.props.screenShare) {
      classNames.push("user-my-conn");
    }

    if (this.props.connection.audioOnly) {
      classNames.push("audio-only");
    }

    return (
      React.DOM.div(null, 
        React.DOM.i({className: "user-indicator floobits-close-icon", title: "Stop video chat", onClick: this.stop}), 
        React.DOM.div({className: "visualizer-container"}, 
          React.DOM.div({className: "visualizer", ref: "volume"})
        ), 
        React.DOM.div({className: "user-face"}, 
          React.DOM.video({className: classNames.join(" "), 
                 ref: "user-thumb-" + this.props.connection.id, 
                 src: this.props.src, 
                 srcObject: this.props.screenShare ? this.props.connection.screenStream : this.props.connection.stream, 
                 autoPlay: "autoplay", 
                 poster: this.poster, 
                 muted: this.props.connection.isMe ? "muted" : null}
          ), 
          React.DOM.div({className: "click-to-video", onClick: this.onClick}, 
            React.DOM.i({className: "glyphicon glyphicon-fullscreen"}), " " + ' ' +
            "Fullscreen video"
          )
        ), 
        this.state.noMic &&
          React.DOM.i({className: "glyphicon user-indicator no-mic", title: "No sound detected from microphone."})
      )
    );
  }
});

const ListViewMixin = {
  mixins: [flux.createAutoBinder(['users'])],
  /** @inheritDoc */
  render: function ListViewMixin() {
    let thumbnailNodes = [];

    this.props.users.forEach(function (user) {
      var hasRendered = false;
      user.connections.sort();
      user.connections.forEach(function (connection) {
        var args;
        if (!connection.connected) {
          return;
        }

        args = {
          connection: connection,
          key: connection.id,
          user: user,
          me: this.props.me,
          isListView: this.isListView,
          prefs: this.props.prefs,
        };
        if (connection.streamURL) {
          hasRendered = true;
          args.src = connection.streamURL;
          args.key += "video";
          // React.createElement
          thumbnailNodes.push(VideoThumbnailView(args));
        } else if (connection.image) {
          hasRendered = true;
          args.key += "image";
          thumbnailNodes.push(ImageThumbnailView(args));
        }

        if (!hasRendered) {
          hasRendered = true;
          args.key += "gravatar";
          thumbnailNodes.push(GravatarThumbnailView(args));
        }

        if (connection.screenStreamURL) {
          args.src = connection.screenStreamURL;
          args.key += "screen";
          args.screenShare = true;
          thumbnailNodes.push(VideoThumbnailView(args));
        }
      }, this);
    }, this);
    return (
      React.DOM.div({className: "user-list"}, 
        thumbnailNodes
      )
    );
  }
};

const ChatUserlistView = React.createClass({displayName: 'ChatUserlistView',
  mixins: [ListViewMixin],
  componentName: "ChatUserlistView",
  isListView: true,
});

const UserlistView = React.createClass({displayName: 'UserlistView',
  componentName: "UserlistView",
  mixins: [ListViewMixin],
  isListView: false,
});

module.exports = {
  Connection:Connection,
  ChatUserlistView:ChatUserlistView,
  NotMeUserView:NotMeUserView,
  UserlistView:UserlistView,
};

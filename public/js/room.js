// Generated by CoffeeScript 1.6.3
(function() {
  var User,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  User = (function() {
    function User(rid, apiKey, sid, token) {
      var self,
        _this = this;
      this.rid = rid;
      this.apiKey = apiKey;
      this.sid = sid;
      this.token = token;
      this.writeChatData = __bind(this.writeChatData, this);
      this.removeStream = __bind(this.removeStream, this);
      this.applyClassFilter = __bind(this.applyClassFilter, this);
      this.errorSignal = __bind(this.errorSignal, this);
      this.syncStreamsProperty = __bind(this.syncStreamsProperty, this);
      this.setLeaderProperties = __bind(this.setLeaderProperties, this);
      this.sendSignal = __bind(this.sendSignal, this);
      this.inputKeypress = __bind(this.inputKeypress, this);
      this.signalReceivedHandler = __bind(this.signalReceivedHandler, this);
      this.connectionDestroyedHandler = __bind(this.connectionDestroyedHandler, this);
      this.connectionCreatedHandler = __bind(this.connectionCreatedHandler, this);
      this.streamDestroyedHandler = __bind(this.streamDestroyedHandler, this);
      this.streamCreatedHandler = __bind(this.streamCreatedHandler, this);
      this.sessionDisconnectedHandler = __bind(this.sessionDisconnectedHandler, this);
      this.messageTemplate = Handlebars.compile($("#messageTemplate").html());
      this.userStreamTemplate = Handlebars.compile($("#userStreamTemplate").html());
      this.notifyTemplate = Handlebars.compile($("#notifyTemplate").html());
      this.initialized = false;
      this.chatData = [];
      this.filterData = {};
      this.allUsers = {};
      this.printCommands();
      this.subscribers = {};
      this.leader = false;
      this.layout = OT.initLayoutContainer(document.getElementById("streams_container"), {
        fixedRatio: true,
        animate: true,
        bigClass: "OT_big",
        bigPercentage: 0.85,
        bigFixedRatio: false,
        easing: "swing"
      }).layout;
      this.publisher = OT.initPublisher(this.apiKey, "myPublisher", {
        width: "100%",
        height: "100%"
      });
      this.session = OT.initSession(this.apiKey, this.sid);
      this.session.on({
        "sessionDisconnected": this.sessionDisconnectedHandler,
        "streamCreated": this.streamCreatedHandler,
        "streamDestroyed": this.streamDestroyedHandler,
        "connectionCreated": this.connectionCreatedHandler,
        "connectionDestroyed": this.connectionDestroyedHandler,
        "signal": this.signalReceivedHandler
      });
      this.session.connect(this.token, function(err) {
        if (err) {
          alert("Unable to connect to session. Sorry");
          return;
        }
        _this.myConnectionId = _this.session.connection.connectionId;
        _this.name = "Guest-" + (_this.myConnectionId.substring(_this.myConnectionId.length - 8, _this.myConnectionId.length));
        _this.allUsers[_this.myConnectionId] = _this.name;
        _this.session.publish(_this.publisher);
        _this.layout();
        $("#messageInput").removeAttr("disabled");
        return $('#messageInput').focus();
      });
      self = this;
      $(".filterOption").click(function() {
        var prop;
        $(".filterOption").removeClass("optionSelected");
        prop = $(this).data('value');
        self.applyClassFilter(prop, "#myPublisher");
        $(this).addClass("optionSelected");
        self.sendSignal("filter", {
          cid: self.session.connection.connectionId,
          filter: prop
        });
        return self.filterData[self.session.connection.connectionId] = prop;
      });
      $('#chatroom').click(function() {
        $(".container").css('right', '0px');
        return $("#messageInput").focus();
      });
      $('#messageInput').keypress(this.inputKeypress);
      $("#streams_container").click(function() {
        return $('.container').css('right', '-300px');
      });
      $(".container").on("transitionend webkitTransitionEnd oTransitionEnd otransitionend", function(event) {
        return self.layout();
      });
      window.onresize = function() {
        return self.layout();
      };
    }

    User.prototype.sessionDisconnectedHandler = function(event) {
      console.log(event.reason);
      if (event.reason === "forceDisconnected") {
        alert("Someone in the room found you offensive and removed you. Please evaluate your behavior");
      } else {
        alert("You have been disconnected! Please try again");
      }
      return window.location = "/";
    };

    User.prototype.streamCreatedHandler = function(event) {
      var divId, divId$, self, stream, streamConnectionId;
      console.log("streamCreated");
      stream = event.stream;
      streamConnectionId = stream.connection.connectionId;
      divId = "stream" + streamConnectionId;
      $("#streams_container").append(this.userStreamTemplate({
        id: divId,
        connectionId: streamConnectionId
      }));
      this.subscribers[streamConnectionId] = this.session.subscribe(stream, divId, {
        width: "100%",
        height: "100%"
      });
      divId$ = $("." + divId);
      divId$.mouseenter(function() {
        return $(this).find('.flagUser').show();
      });
      divId$.mouseleave(function() {
        return $(this).find('.flagUser').hide();
      });
      self = this;
      divId$.find('.flagUser').click(function() {
        var streamConnection;
        streamConnection = $(this).data('streamconnection');
        if (confirm("Is this user being inappropriate? If so, we are sorry that you had to go through that. Click confirm to remove user")) {
          self.applyClassFilter("Blur", "." + streamConnection);
          return self.session.forceDisconnect(streamConnection.split("stream")[1]);
        }
      });
      this.syncStreamsProperty();
      return this.layout();
    };

    User.prototype.streamDestroyedHandler = function(event) {
      this.removeStream(event.stream.connection.connectionId);
      return this.layout();
    };

    User.prototype.connectionCreatedHandler = function(event) {
      var cid, guestName;
      cid = "" + event.connection.connectionId;
      if (!this.allUsers[cid]) {
        guestName = "Guest-" + (cid.substring(cid.length - 8, cid.length));
        this.allUsers[cid] = guestName;
      }
      this.sendSignal("initialize", {
        chat: this.chatData,
        filter: this.filterData,
        users: this.allUsers,
        random: [1, 2, 3],
        leader: this.leader
      }, event.connection);
      return this.displayChatMessage(this.notifyTemplate({
        message: "" + this.allUsers[cid] + " has joined the room"
      }));
    };

    User.prototype.connectionDestroyedHandler = function(event) {
      var cid;
      cid = "" + event.connection.connectionId;
      this.displayChatMessage(this.notifyTemplate({
        message: "" + this.allUsers[cid] + " has left the room"
      }));
      if (this.subscribers[cid]) {
        delete this.subscribers[cid];
      }
      return delete this.allUsers[cid];
    };

    User.prototype.signalReceivedHandler = function(event) {
      var e, k, oldName, streamConnectionId, v, val, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;
      console.log("hello world");
      event.data = JSON.parse(event.data);
      console.log(event);
      switch (event.type) {
        case "signal:initialize":
          console.log("initialize handler");
          if (this.initialized) {
            return;
          }
          this.leader = event.data.leader;
          _ref = event.data.users;
          for (k in _ref) {
            v = _ref[k];
            this.allUsers[k] = v;
          }
          _ref1 = event.data.filter;
          for (k in _ref1) {
            v = _ref1[k];
            this.filterData[k] = v;
          }
          _ref2 = event.data.chat;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            e = _ref2[_i];
            this.writeChatData(e);
          }
          this.initialized = true;
          return this.syncStreamsProperty();
        case "signal:chat":
          return this.writeChatData(event.data);
        case "signal:focus":
          this.leader = event.data;
          _ref3 = $(".streamContainer");
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            e = _ref3[_j];
            this.setLeaderProperties(e);
          }
          if (this.myConnectionId === this.leader) {
            $("#myPublisherContainer").addClass("OT_big");
          }
          this.layout();
          return this.writeChatData({
            name: this.allUsers[event.data],
            text: "/serv " + this.allUsers[event.data] + " is leading the group. Everybody else's video bandwidth is restricted."
          });
        case "signal:unfocus":
          this.leader = false;
          $("#myPublisherContainer").removeClass("OT_big");
          _ref4 = $(".streamContainer");
          for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
            e = _ref4[_k];
            $(e).removeClass("OT_big");
            streamConnectionId = $(e).data('connectionid');
            if (this.subscribers[streamConnectionId]) {
              this.subscribers[streamConnectionId].restrictFrameRate(false);
            }
          }
          this.layout();
          return this.writeChatData({
            name: this.allUsers[event.data],
            text: "/serv Everybody is now on equal standing. No one leading the group."
          });
        case "signal:filter":
          val = event.data;
          return this.applyClassFilter(val.filter, ".stream" + val.cid);
        case "signal:name":
          oldName = this.allUsers[event.data[0]];
          this.allUsers[event.data[0]] = event.data[1];
          return this.writeChatData({
            name: this.allUsers[event.data[0]],
            text: "/serv " + oldName + " is now known as " + this.allUsers[event.data[0]]
          });
      }
    };

    User.prototype.inputKeypress = function(e) {
      var k, msgData, parts, text, v, _ref, _ref1;
      msgData = {};
      if (e.keyCode !== 13) {
        return;
      }
      text = $('#messageInput').val().trim();
      if (text.length < 1) {
        return;
      }
      parts = text.split(' ');
      switch (parts[0]) {
        case "/hide":
          $('#messageInput').blur();
          $('.container').css('right', '-300px');
          break;
        case "/help":
          this.printCommands();
          break;
        case "/list":
          this.displayChatMessage(this.notifyTemplate({
            message: "-----------"
          }));
          this.displayChatMessage(this.notifyTemplate({
            message: "Users currently in the room"
          }));
          _ref = this.allUsers;
          for (k in _ref) {
            v = _ref[k];
            this.displayChatMessage(this.notifyTemplate({
              message: "- " + v
            }));
          }
          this.displayChatMessage(this.notifyTemplate({
            message: "-----------"
          }));
          break;
        case "/focus":
          this.sendSignal("focus", this.myConnectionId);
          break;
        case "/unfocus":
          this.sendSignal("unfocus", this.myConnectionId);
          break;
        case "/name":
        case "/nick":
          _ref1 = this.allUsers;
          for (k in _ref1) {
            v = _ref1[k];
            if (v === parts[1] || parts[1].length <= 2) {
              alert("Sorry, but that name has already been taken or is too short.");
              return;
            }
          }
          this.name = parts[1];
          this.sendSignal("name", [this.myConnectionId, this.name]);
          break;
        default:
          this.sendSignal("chat", {
            name: this.name,
            text: text
          });
      }
      return $('#messageInput').val('');
    };

    User.prototype.sendSignal = function(type, data, to) {
      data = {
        type: type,
        data: JSON.stringify(data)
      };
      if (to != null) {
        data.to = to;
      }
      return this.session.signal(data, this.errorSignal);
    };

    User.prototype.setLeaderProperties = function(e) {
      var streamConnectionId;
      streamConnectionId = $(e).data('connectionid');
      if (streamConnectionId === this.leader && this.subscribers[this.leader]) {
        $(e).addClass("OT_big");
        return this.subscribers[this.leader].restrictFrameRate(false);
      } else {
        $(e).removeClass("OT_big");
        if (this.subscribers[streamConnectionId] && (this.subscribers[this.leader] || this.leader === this.myConnectionId)) {
          console.log("restricting frame rate of non leader");
          return this.subscribers[streamConnectionId].restrictFrameRate(true);
        }
      }
    };

    User.prototype.syncStreamsProperty = function() {
      var e, streamConnectionId, _i, _len, _ref;
      _ref = $(".streamContainer");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        this.setLeaderProperties(e);
        streamConnectionId = $(e).data('connectionid');
        if (this.filterData && this.filterData[streamConnectionId]) {
          this.applyClassFilter(this.filterData[streamConnectionId], ".stream" + streamConnectionId);
        }
      }
      if (this.myConnectionId === this.leader) {
        $("#myPublisherContainer").addClass("OT_big");
      }
      return this.layout();
    };

    User.prototype.errorSignal = function(error) {
      if (error) {
        return console.log("signal error: " + error.reason);
      }
    };

    User.prototype.applyClassFilter = function(prop, selector) {
      if (prop) {
        $(selector).removeClass("Blur Sepia Grayscale Invert");
        $(selector).addClass(prop);
        return console.log("applyclassfilter..." + prop);
      }
    };

    User.prototype.removeStream = function(cid) {
      var element$;
      element$ = $(".stream" + cid);
      return element$.remove();
    };

    User.prototype.writeChatData = function(val) {
      var e, message, text, urlRegex, _i, _len;
      this.chatData.push({
        name: val.name,
        text: unescape(val.text)
      });
      text = val.text.split(' ');
      if (text[0] === "/serv") {
        this.displayChatMessage(this.notifyTemplate({
          message: val.text.split("/serv")[1]
        }));
        return;
      }
      message = "";
      urlRegex = /(https?:\/\/)?([\da-z\.-]+)\.([a-z]{2,6})(\/.*)?$/g;
      for (_i = 0, _len = text.length; _i < _len; _i++) {
        e = text[_i];
        if (e.length < 2000 && e.match(urlRegex) && e.split("..").length < 2 && e[e.length - 1] !== ".") {
          message += e.replace(urlRegex, "<a href='http://$2.$3$4' target='_blank'>$1$2.$3$4<a>") + " ";
        } else {
          message += Handlebars.Utils.escapeExpression(e) + " ";
        }
      }
      val.text = message;
      return this.displayChatMessage(this.messageTemplate(val));
    };

    User.prototype.displayChatMessage = function(message) {
      $("#displayChat").append(message);
      return $('#displayChat')[0].scrollTop = $('#displayChat')[0].scrollHeight;
    };

    User.prototype.printCommands = function() {
      this.displayChatMessage(this.notifyTemplate({
        message: "-----------"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Welcome to OpenTokRTC by TokBox"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /nick your_name to change your name"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /list to see list of users in the room"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /help to see a list of commands"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /hide to hide chat bar"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /focus to lead the group"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "Type /unfocus to put everybody on equal standing"
      }));
      this.displayChatMessage(this.notifyTemplate({
        message: "-----------"
      }));
      $(".chatMessage:first").css("margin-top", $("#title").outerHeight() + "px");
      return $(".chatMessage:contains('Welcome to OpenTokRTC')").find('em').css("color", "#000");
    };

    return User;

  })();

  window.User = User;

}).call(this);

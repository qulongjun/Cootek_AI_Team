//login.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    change_bind:false,
    help_status: false,
    userid_focus: false,
    passwd_focus: false,
    userid: '',
    passwd: '',
    angle: 0
  },
  onLoad:function(option){
    var _this=this;
    _this.setData({
      change_bind: option.change_bind||false
    });
  },
  onReady: function(){
    var _this = this;
    setTimeout(function(){
      _this.setData({
        remind: ''
      });
    }, 1000);
    wx.onAccelerometerChange(function(res) {
      var angle = -(res.x*30).toFixed(1);
      if(angle>14){ angle=14; }
      else if(angle<-14){ angle=-14; }
      if(_this.data.angle !== angle){
        _this.setData({
          angle: angle
        });
      }
    });
  },
  bind: function() {
    var _this = this;
    if(app.g_status){
      app.showErrorModal(app.g_status, '绑定失败');
      return;
    }
    if(!_this.data.userid || !_this.data.passwd){
      app.showErrorModal('姓名及手机不能为空', '提醒');
      return false;
    }
    if(!app._user.openid){
      app.showErrorModal('未能成功登录', '错误');
      return false;
    }
    app.showLoadToast('绑定中');
    wx.request({
      method: 'POST',
      url: app._server + '/api/user/bind',
      data: {
        id: app._user.openid,
        realName: _this.data.userid,
        tel: _this.data.passwd,
        change_bind: _this.data.change_bind||false
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res){
        if(res.data && res.data.code === 200){
          app.showLoadToast('请稍候');
          //清除缓存
          app.cache = {};
          wx.clearStorage();
          app.getUser(function(){
            wx.showToast({
              title: '绑定成功',
              icon: 'success',
              duration: 1500,
              success:function(){
                setTimeout(function(){
                  wx.navigateBack();
                },1500);
              }
            });
          });
        }else{
          wx.hideToast();
          app.showErrorModal(res.data.message, '绑定失败');
        }
      },
      fail: function(res){
        wx.hideToast();
        app.showErrorModal(res.errMsg, '绑定失败');
      }
    });
  },
  useridInput: function(e) {
    this.setData({
      userid: e.detail.value
    });
  },
  telInput: function(e) {
    this.setData({
      passwd: e.detail.value
    });
  },
  inputFocus: function(e){
    if(e.target.id == 'userid'){
      this.setData({
        'userid_focus': true
      });
    }else if(e.target.id == 'passwd'){
      this.setData({
        'passwd_focus': true
      });
    }
  },
  inputBlur: function(e){
    if(e.target.id == 'userid'){
      this.setData({
        'userid_focus': false
      });
    }else if(e.target.id == 'passwd'){
      this.setData({
        'passwd_focus': false
      });
    }
  },
  tapHelp: function(e){
    if(e.target.id == 'help'){
      this.hideHelp();
    }
  },
  showHelp: function(e){
    this.setData({
      'help_status': true
    });
  },
  hideHelp: function(e){
    this.setData({
      'help_status': false
    });
  }
});
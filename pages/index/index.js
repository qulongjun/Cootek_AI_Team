//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    offline: false,
    remind: '加载中',
    cores: [
      [
        { id: 'dc', name: '团队订餐', disabled: false, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: true },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: true },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: false },
        { id: 'cj', name: '尚未开放', disabled: true, offline_disabled: true }
      ]
    ],
    card: {
      dc: {
        display:false
      }
    },
    user: {},
    disabledItemTap: false //点击了不可用的页面
  },
  //分享
  onShareAppMessage: function () {
    return {
      title: '触宝AI',
      desc: '触宝AI实验室管理移动门户',
      path: '/pages/index/index'
    };
  },
  //下拉更新
  onPullDownRefresh: function () {
    if (app._user.is_bind) {
      console.log("下拉刷新")
      this.getCardData();
    } else {
      wx.stopPullDownRefresh();
    }
  },
  onShow: function () {
    var _this = this;
    //离线模式重新登录
    if (_this.data.offline) {
      _this.login();
      return false;
    }
    function isEmptyObject(obj) { for (var key in obj) { return false; } return true; }
    function isEqualObject(obj1, obj2) { if (JSON.stringify(obj1) != JSON.stringify(obj2)) { return false; } return true; }
    var l_user = _this.data.user,  //本页用户数据
      g_user = app._user; //全局用户数据
    //排除第一次加载页面的情况（全局用户数据未加载完整 或 本页用户数据与全局用户数据相等）
    if (isEmptyObject(l_user) || !g_user.openid || isEqualObject(l_user.we, g_user.we)) {
      return false;
    }
    //全局用户数据和本页用户数据不一致时，重新获取卡片数据
    if (!isEqualObject(l_user.we, g_user.we)) {
      //判断绑定状态
      if (!g_user.is_bind) {
        _this.setData({
          'remind': '未绑定'
        });
      } else {
        _this.setData({
          'remind': '加载中'
        });
        //清空数据
        _this.setData({
          user: app._user
        });
        console.log("清空数据");
        _this.getCardData();
      }
    }
  },
  onLoad: function () {
    this.login();
  },
  login: function () {
    var _this = this;
    //登录用户
    app.getUser(function (status) {
      _this.response.call(_this, status);
    });
  },
  response: function (status) {
    var _this = this;
    if (status) {
      if (status != '离线缓存模式') {
        //错误
        _this.setData({
          'remind': status
        });
        return;
      } else {
        //离线缓存模式
        _this.setData({
          offline: true
        });
      }
    }
    _this.setData({
      user: app._user
    });
    //判断绑定状态
    if (!app._user.is_bind) {
      _this.setData({
        'remind': '未绑定'
      });
    } else {
      _this.setData({
        'remind': '加载中'
      });
      console.log("response")
      _this.getCardData();
    }
  },
  disabled_item: function () {
    var _this = this;
    if (!_this.data.disabledItemTap) {
      _this.setData({
        disabledItemTap: true
      });
      setTimeout(function () {
        _this.setData({
          disabledItemTap: false
        });
      }, 2000);
    }
  },
  getCardData: function () {
    var _this = this;
    orderRender();
    if (_this.data.offline) { return; }
    wx.showNavigationBarLoading();
    //团队订餐渲染
    function orderRender(info) {
      wx.request({
        url: app._server + '/api/order/today',
        method: 'POST',
        data: {
          userId:app._user.we.id
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          if (res.data && res.data.code === 200) {
            var info = res.data.data;
            if (info) {
              _this.setData({
                remind: '',
                'card.dc':info 
              });
              _this.setData({
                'card.dc.show': true,
                'card.dc.display': true
              });

            }
          } else { 
            if (_this.data.remind == '加载中') {
              _this.setData({
                remind: '',
                'card.dc.display': true
              });
            }
           }
        },
        complete: function () {
          wx.hideNavigationBarLoading();
        }
      });
    }
    wx.hideNavigationBarLoading();
  }
});
//app.js
App({
  version: 'v0.0.1', //版本号
  onLaunch: function() {
    var _this = this;
    //读取缓存
    try {
      var data = wx.getStorageInfoSync();
      if (data && data.keys.length) {
        data.keys.forEach(function(key) {
          var value = wx.getStorageSync(key);
          if (value) {
            _this.cache[key] = value;
          }
        });
        if (_this.cache.version !== _this.version) {
          _this.cache = {};
          wx.clearStorage();
        } else {
          _this._user.wx = _this.cache.userinfo.userInfo || {};
          _this.processData(_this.cache.userdata);
        }
      }
    } catch(e) { console.warn('获取缓存失败'); }
  },
  //保存缓存
  saveCache: function(key, value) {
    if(!key || !value){return;}
    var _this = this;
    _this.cache[key] = value;
    wx.setStorage({
      key: key,
      data: value
    });
  },
  //清除缓存
  removeCache: function(key) {
    if(!key){return;}
    var _this = this;
    _this.cache[key] = '';
    wx.removeStorage({
      key: key
    });
  },
  //后台切换至前台时
  onShow: function(){

  },
  //判断是否有登录信息，让分享时自动登录
  loginLoad: function(onLoad){
    var _this = this;
    if(!_this._t){  //无登录信息
      _this.getUser(function(e){
        typeof onLoad == "function" && onLoad(e);
      });
    }else{  //有登录信息
      typeof onLoad == "function" && onLoad();
    }
  },
  //getUser函数，在index中调用
  getUser: function(response) { 
    var _this = this;
    wx.showNavigationBarLoading();
    wx.login({
      success: function(res){
        if(res.code){
          //调用函数获取微信用户信息
          _this.getUserInfo(function(info){
            _this.saveCache('userinfo', info);
            _this._user.wx = info.userInfo;
            if(!info.encryptedData || !info.iv){
              _this.g_status = '无关联AppID';
              typeof response == "function" && response(_this.g_status);
              return;
            }
            //发送code与微信用户信息，获取员工数据
            wx.request({
              method: 'POST',
              url: _this._server + '/api/user/info',
              data: {
                code: res.code
              },
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              success: function(res){
                if(res.data && res.data.code >= 200 && res.data.code < 400){
                  var status = false, data = res.data.data;
                  //判断缓存是否有更新
                  if(_this.cache.version !== _this.version || _this.cache.userdata !== data){
                    _this.saveCache('version', _this.version);
                    _this.saveCache('userdata', data);
                    _this.processData(data);
                    status = true;
                  }
                  if(!_this._user.is_bind){
                    wx.navigateTo({
                      url: '/pages/more/login'
                    });
                  }
                  //如果缓存有更新，则执行回调函数
                  if(status){
                    typeof response == "function" && response();
                  }
                }else{
                  //清除缓存
                  if(_this.cache){
                    _this.cache = {};
                    wx.clearStorage();
                  }
                  typeof response == "function" && response(res.data.message || '加载失败');
                }
              },
              fail: function(res){
                var status = '';
                // 判断是否有缓存
                if(_this.cache.version === _this.version){
                  status = '离线缓存模式';
                }else{
                  status = '网络错误';
                }
                _this.g_status = status;
                typeof response == "function" && response(status);
                console.warn(status);
              },
              complete: function(){
                wx.hideNavigationBarLoading();
              }
            });
          });
        }
      }
    });
  },

  processData: function(data){
    var _this = this;
    _this._user.is_bind = data.is_bind;
    _this._user.openid = data.id;
    _this._user.we = data.user;
    _this._user._time = data.time;
    _this._t = data['\x74\x6f\x6b\x65\x6e'];
    console.log(_this);
    return data;
  },
  getUserInfo: function(cb){
    var _this = this;
    //获取微信用户信息
    wx.getUserInfo({
      success: function(res){
        typeof cb == "function" && cb(res);
      },
      fail: function(res){
        _this.showErrorModal('拒绝授权将导致无法实名认证并影响使用，请重新打开“触宝AI实验室”小程序再点击允许授权！', '授权失败');
        _this.g_status = '未授权';
      }
    });
  },
  //完善信息
  appendInfo: function(data){
    var _this = this;
    _this.cache = {};
    wx.clearStorage();
    _this._user.we.build = data.build || '';
    _this._user.we.room = data.room || '';
  },
  showErrorModal: function(content, title){
    wx.showModal({
      title: title || '加载失败',
      content: content || '未知错误',
      showCancel: false
    });
  },
  showLoadToast: function(title, duration){
    wx.showToast({
      title: title || '加载中',
      icon: 'loading',
      mask: true,
      duration: duration || 10000
    });
  },
  util: require('./utils/util'),
  key: function(data){ return this.util.key(data) },
  enCodeBase64:function(data){ return this.util.base64.encode(data)},
  cache: {},
  // _server: 'http://test.qulongjun.cn:8080',
  _server: 'https://team.qulongjun.com',
  _user: {
    //微信数据
    wx: {},
    //用户数据
    we: {}
  },
});
//bx_detail.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    detail: {},   //工单详情
    state: [],     //处理详情(申请-审核-受理-派单-完工-驳回.倒序)
    id:''
  },
  //下拉更新
  onPullDownRefresh: function(){
    this.getData();
  },
  onLoad: function(options){
    this.setData({
      id: options.id
    });
    this.getData();
  },
  getData: function () {
    var _this = this;
    if(!app._user.we.id || !_this.data.id){
      _this.setData({
        remind: '404'
      });
      return false;
    }
    // 发送请求
    wx.request({
      url: app._server + "/api/order/findById", 
      method: 'POST',
      data: {
        id:_this.data.id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res) {
        if(res.data && res.data.code === 200) {
          var info = res.data.data;
          //报修内容过滤标签
          // info.wx_bt = _this.convertHtmlToText(info.wx_bt).replace(/[\r|\n]/g, "");
          // info.wx_bxnr = _this.convertHtmlToText(info.wx_bxnr);
          //处理详情
          var state = [{
            'type': 'refused',
            name: '取消',
            status: info.state == -1,
            list: {
              '取消时间': info.cancel_time == null ? '未知' : info.cancel_time
            }
          },{
            'type': 'finished',
            name: '完成',
            status: info.state >=2,
            list: {
              '完成时间': info.finish_time == null ? '未知' : info.finish_time
            }
          },{
            'type': 'accepted',
            name: '受理',
            status: info.state>=1,
            list: {
              '受理人': info.accepter == null ? '未知' : info.accepter.realName,
              '响应时间': info.accept_time == null ? '未知' : info.accept_time
            }
          },{
            'type': 'waited',
            name: '下单',
            status: true,
            list: {
              '下单人': app._user.we.realName,
              '下单时间': info.create_time
            }
          }];
          _this.setData({
            'detail': info,
            'state': state.filter(function(e,i){
              return e.status
            }),
            'remind': ''
          });
        }else{
          _this.setData({
            remind: res.data.message || '未知错误'
          });
        }
      },
      fail: function(res) {
        app.showErrorModal(res.errMsg);
        _this.setData({
          remind: '网络错误'
        });
      },
      complete: function(){
        wx.stopPullDownRefresh();
      }
    });
  },
  cancelOrder:function(){
    var _this = this;
    wx.showModal({
      title: '提示',
      content: '您正在取消订单，是否继续？',
      confirmText: '继续',
      success: function (res) {
        if (res.confirm) {
          wx.request({
            method: 'POST',
            url: app._server + '/api/order/cancel',
            data: {
              id:_this.data.id
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {
              if (res.data && res.data.code === 200) {
                app.showLoadToast('请稍候');
                wx.showToast({
                  title: '取消成功',
                  icon: 'success',
                  duration: 1500,
                  complete:function(){
                    setTimeout(function(){
                      wx.navigateBack();
                    },1500)
                  }
                });
                // wx.navigateBack();
              } else {
                wx.hideToast();
                app.showErrorModal(res.data.message, '取消失败');
              }
            },
            fail: function (res) {
              wx.hideToast();
              app.showErrorModal(res.errMsg, '取消失败');
            }
          });
        }
      }
    });
  },
  convertHtmlToText: function(inputText){
    var returnText = "" + inputText;
    returnText = returnText.replace(/<\/?[^>]*>/g, '').replace(/[ | ]*\n/g, '\n').replace(/ /ig, '')
                  .replace(/&mdash/gi,'-').replace(/&ldquo/gi,'“').replace(/&rdquo/gi,'”');
    return returnText;
  }
  
});
//bx.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    count: '-',
    list: [],
    process_state: {
      '未审核': 'waited',
      '未受理': 'waited',
      '已受理': 'accepted',
      '已派出': 'dispatched',
      '已完工': 'finished',
      '驳回': 'refused'
    }
  },
  //下拉更新
  onPullDownRefresh: function(){
    this.getData();
  },
  onLoad: function(){
    this.getData();
  },
  getData: function(){
    var that = this;
    if(!app._user.we.id){
      that.setData({
        remind: '未绑定'
      });
      return false;
    }
    // 发送请求
    wx.request({
      url: app._server + "/api/order/history", 
      method: 'POST',
      data: {
        userId: app._user.we.id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res) {
        if(res.data && res.data.code === 200) {
          var list = res.data.data;
          if(!list || !list.length){
            that.setData({
              'remind': '无订餐记录'
            });
          }else{
            for(var i = 0, len = list.length; i < len; i++) {
              list[i].state = that.data.process_state['未审核'];
              list[i].wx_bt = '这是啥';
            }
            that.setData({
              'list': list,
              'count': len,
              'remind': ''
            });
          }
        }else{
          that.setData({
            remind: res.data.message || '未知错误',
            'count': 0
          });
        }
      },
      fail: function(res) {
        app.showErrorModal(res.errMsg);
        that.setData({
          remind: '网络错误',
          'count': 0
        });
      },
      complete: function(){
        wx.stopPullDownRefresh();
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


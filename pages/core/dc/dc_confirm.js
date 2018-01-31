//bx_apply.js
//获取应用实例
var app = getApp();
Page({
  remind: '加载中',
  data: {
    formData: {             //表单数据
        id: '',         //id
        foodId:'',
        name: '',       //姓名
        time: '',      //就餐日期
        food:'',
        shop:'',
        category:''
    },
    showError: false
  },
  onLoad: function(option){
    console.log(option);
    if(!app._user.we.id || !app._user.we.realName){
      this.setData({
        remind: '未绑定'
      });
      return false;
    }

    function getDate(){
      var nowDate = new Date();
      var year = nowDate.getFullYear();
      var month = nowDate.getMonth() + 1 < 10 ? "0" + (nowDate.getMonth() + 1)
        : nowDate.getMonth() + 1;
      var day = nowDate.getDate() < 10 ? "0" + nowDate.getDate() : nowDate
        .getDate();
      var dateStr = year + "-" + month + "-" + day;
      return dateStr;
    }

    function isLate(){
      var standard = getDate()+" 16:00:00";
      var standardDate =new Date(standard);
      if (standardDate < (new Date())){
        //只能明天起
        var curDate = new Date();
        var nextDate = new Date(curDate.getTime() + 24 * 60 * 60 * 1000);
        var year = nextDate.getFullYear();
        var month = nextDate.getMonth() + 1 < 10 ? "0" + (nextDate.getMonth() + 1)
          : nextDate.getMonth() + 1;
        var day = nextDate.getDate() < 10 ? "0" + nextDate.getDate() : nextDate
          .getDate();
        var dateStr = year + "-" + month + "-" + day;
        return dateStr;
      }else{
        //可以今天
        return getDate();
      }
    }

    this.setData({
      'formData.id': app._user.we.id,
      'formData.foodId':option.id,
      'formData.name': app._user.we.realName,
      'formData.time': isLate()+" 18:30:00",
      'formData.food': option.name,
      'formData.shop': option.shop,
      'formData.category': option.category,
      'start': isLate()
    });
  },
  bindDateChange:function(e){
    this.setData({
      'formData.time': e.detail.value + " 18:30:00"
    });
  },
  submitApply: function(e) {
    var _this = this,
        formData = _this.data.formData;
    _this.setData({
        showError: true
    }); 
    // 验证表单
    if (!formData.id || !formData.time || !formData.foodId){
      return false;
    }
    wx.showModal({
      title: '提示',
      content: '是否预定'+formData.time+'的晚餐'+formData.food+'？',
      success: function(res) {
        if (res.confirm) {
          formData.userId = app._user.we.id;
          wx.request({
            url: app._server + '/api/order/create',
            method: 'POST',
            data: formData,
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function(res) {
              if(res.data && res.data.code === 200){
                wx.showToast({
                  title: '订餐成功',
                  icon: 'success',
                  duration: 2000,
                  complete:function(){
                    setTimeout(function(){
                      wx.navigateBack({
                        delta: 2
                      });
                    },2000);
                  }
                });
                // wx.navigateBack();
              }else{
                var errorMessage = (res.data.data && res.data.data.reason) || res.data.message;
                if (res.data && res.data.code === 502) {
                  errorMessage="您已预定过当日晚餐，更改菜品请先取消订单！";
                }
                
                app.showErrorModal(errorMessage,"订餐失败");
              }
            },
            fail: function(res) {
              app.showErrorModal(res.errMsg);
            }
          });
        }
      }
    });

  }
  
});


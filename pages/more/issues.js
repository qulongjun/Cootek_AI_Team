//issues.js
//获取应用实例
var app = getApp();
Page({
  data: {
    list_remind: '加载中',
    list: {
      status: false,  //是否显示列表
      count: '-',   //次数
      data: [],    //列表内容
      open: 0      //被展示的序号
    },
    title: '',
    content: '',
    info: '',
    imgs: [],
    imgLen: 0,
    upload: true,
    uploading: false,
    qiniu: '',
    showError: false,
    user: {}
  },
  onLoad: function () {
    var _this = this;
    wx.getSystemInfo({
      success: function (res) {
        var info = '---\r\n**用户信息**\r\n';
        info += '用户名：' + app._user.wx.nickName;
        if (app._user.we && app._user.we.realName) {
          info += '（' + app._user.we.realName + '-' + app._user.we.id + '）';
        }
        info += '\r\n手机型号：' + res.model;
        info += '（' + res.platform + ' - ' + res.windowWidth + 'x' + res.windowHeight + '）';
        info += '\r\n微信版本号：' + res.version;
        info += '\r\n触宝AI版本号：' + app.version;
        _this.setData({
          info: info
        });
      }
    });
    if (app.g_status) { return; }
    wx.showNavigationBarLoading();
    wx.request({
      url: app._server + '/api/feedback/list',
      method: 'POST',
      data: {
        id: app._user.we.id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.code === 200) {
          var list = res.data.data;
          if (list && list.length) {
            _this.setData({
              'list.count': list.length,
              'list.data': list,
              'list_remind': ''
            });
          } else {
            _this.setData({
              'list_remind': '暂无反馈记录',
              'list.count': 0
            });
          }
        } else {
          _this.setData({
            'list_remind': '加载失败'
          });
        }
      },
      fail: function () {
        _this.setData({
          'list_remind': '加载失败'
        });
      },
      complete: function () {
        wx.hideNavigationBarLoading();
      }
    });
  },
  getIssue: function (id, index) {
    var _this = this, thedata = _this.data.list.data[index];
    if (!thedata.content) {
      _this.setData({
        'item_remind': '加载中...'
      });
    } else { return; }
    wx.showNavigationBarLoading();
    wx.request({
      url: 'https://api.github.com/repos/qulongjun/daliy_order/issues/' + id,
      success: function (res) {
        var data = {}, content = res.data;
        content.body = content.body.split('\r\n\r\n---\r\n**用户信息**\r\n')[0];
        data['list.data[' + index + '].content'] = content;
        data['item_remind'] = '';
        _this.setData(data);
      },
      fail: function () {
        _this.setData({
          'item_remind': '加载失败'
        });
      },
      complete: function () {
        wx.hideNavigationBarLoading();
      }
    });
    wx.request({
      url: 'https://api.github.com/repos/qulongjun/daliy_order/issues/' + id + '/comments',
      success: function (res) {
        var data = {};
        data['list.data[' + index + '].comments'] = res.data;
        _this.setData(data);
      },
      complete: function () {
        wx.hideNavigationBarLoading();
      }
    });
  },
  openList: function (e) {
    var _this = this, list = _this.data.list;
    if (!list.status && list.count) {
      _this.getIssue(list.data[0].issues, 0);
    }
    _this.setData({
      'list.status': !list.status
    });
  },
  openItem: function (e) {
    var _this = this, index = e.currentTarget.dataset.index, list = _this.data.list;
    if (index != list.open) {
      _this.getIssue(list.data[index].issues, index);
      _this.setData({
        'list.open': index
      });
    }
  },
  listenerTitle: function (e) {
    this.setData({
      'title': e.detail.value
    });
  },
  listenerTextarea: function (e) {
    this.setData({
      'content': e.detail.value
    });
  },
  choosePhoto: function () {
    var _this = this;
    wx.showModal({
      title: '提示',
      content: '上传图片需要消耗流量，是否继续？',
      confirmText: '继续',
      success: function (res) {
        if (res.confirm) {
          wx.chooseImage({
            count: 1,
            sourceType: ['album'],
            sizeType: ['chooseImage'],
            success: function (res) {
              var tempFilePaths = res.tempFilePaths, imgLen = tempFilePaths.length;
              _this.setData({
                uploading: true,
                imgLen: _this.data.imgLen + imgLen
              });
              tempFilePaths.forEach(function (e) {
                _this.uploadImg(e);
              });
            }
          });
        }
      }
    });
  },
  uploadImg: function (path) {
    var _this = this;
    if (app.g_status) {
      app.showErrorModal(app.g_status, '上传失败');
      return;
    }
    wx.showNavigationBarLoading();
    // 上传图片
    wx.uploadFile({
      url: app._server + '/api/upload/feedback',
      header: {
        'Content-Type': 'multipart/form-data'
      },
      filePath: path,
      name: 'file',
      success: function (res) {
        var data = JSON.parse(res.data);
        if (data.data.path) {
          _this.setData({
            imgs: _this.data.imgs.concat(app._server + data.data.path)
          });
        }
        if (_this.data.imgs.length === _this.data.imgLen) {
          _this.setData({
            uploading: false
          });
        }
      },
      fail: function (res) {
        _this.setData({
          imgLen: _this.data.imgLen - 1
        });
      },
      complete: function () {
        wx.hideNavigationBarLoading();
      }
    });
  },
  previewPhoto: function (e) {
    var _this = this;
    //预览图片
    if (_this.data.uploading) {
      app.showErrorModal('正在上传图片', '预览失败');
      return false;
    }
    wx.previewImage({
      current: _this.data.imgs[e.target.dataset.index],
      urls: _this.data.imgs
    });
  },
  submit: function () {
    var _this = this, title = '', content = '', imgs = '';
    if (app.g_status) {
      app.showErrorModal(app.g_status, '提交失败');
      return;
    }
    _this.setData({
      showError: true
    });
    if (_this.data.uploading || !_this.data.title || !_this.data.content) {
      return false;
    }
    wx.showModal({
      title: '提示',
      content: '是否确认提交反馈？',
      success: function (res) {
        if (res.confirm) {
          title = '【' + app._user.wx.nickName + '】' + _this.data.title;
          content = _this.data.content + '\r\n\r\n' + _this.data.info;
          if (_this.data.imgLen) {
            _this.data.imgs.forEach(function (e) {
              imgs += '\r\n\r\n' + '![img](' + e + '?imageView2/2/w/750/interlace/0/q/88|watermark/2/text/V2Xph43pgq4=/font/5b6u6L2v6ZuF6buR/fontsize/500/fill/I0VGRUZFRg==/dissolve/100/gravity/SouthEast/dx/10/dy/10)';
            });
            content += imgs;
          }
          app.showLoadToast();
          console.log(app._user);
          wx.request({
            url: app._server + '/api/feedback/create',
            data: {
              id: app._user.we.id,
              title: title,
              content: content
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            success: function (res) {
              if (res.data.code === 200) {
                var text = '反馈成功，您可通过访问触宝AI实验室管理系统了解反馈动态';
                wx.showModal({
                  title: '反馈成功',
                  content: text,
                  showCancel: false,
                  success: function (res) {
                    wx.navigateBack();
                  }
                });
              } else {
                app.showErrorModal(res.data.message, '提交失败');
              }
            },
            fail: function (res) {
              app.showErrorModal(res.errMsg, '提交失败');
            },
            complete: function () {
              wx.hideToast();
            }
          });
        }
      }
    });
  }
});
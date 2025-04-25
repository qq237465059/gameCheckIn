// 我的页面
const userService = require('../../services/userService');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoggedIn: false,
    userInfo: {},
    statistics: {
      createdCount: 0,
      joinedCount: 0,
      checkInCount: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkLoginStatus();
    
    // 如果已登录，获取用户统计信息
    if (this.data.isLoggedIn) {
      this.getUserStatistics();
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const userInfo = app.globalData.userInfo;
    
    this.setData({
      isLoggedIn: !!userInfo,
      userInfo: userInfo || {}
    });
  },

  /**
   * 获取用户统计信息
   */
  getUserStatistics: function () {
    userService.getUserStatistics()
      .then(statistics => {
        this.setData({ statistics });
      })
      .catch(error => {
        console.error('获取用户统计信息失败:', error);
      });
  },

  /**
   * 登录
   */
  login: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  /**
   * 退出登录
   */
  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          userService.logout()
            .then(() => {
              // 清除本地用户信息
              app.globalData.userInfo = null;
              wx.removeStorageSync('token');
              
              // 更新页面状态
              this.setData({
                isLoggedIn: false,
                userInfo: {},
                statistics: {
                  createdCount: 0,
                  joinedCount: 0,
                  checkInCount: 0
                }
              });
              
              wx.showToast({
                title: '已退出登录',
                icon: 'success'
              });
            })
            .catch(error => {
              console.error('退出登录失败:', error);
              wx.showToast({
                title: '退出登录失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  /**
   * 上传头像
   */
  uploadAvatar: function () {
    if (!this.data.isLoggedIn) {
      this.login();
      return;
    }
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传头像
        userService.uploadAvatar(tempFilePath)
          .then(result => {
            wx.hideLoading();
            
            // 更新本地用户信息
            const userInfo = { ...this.data.userInfo, avatarUrl: result.avatarUrl };
            app.globalData.userInfo = userInfo;
            
            this.setData({ userInfo });
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
          })
          .catch(error => {
            wx.hideLoading();
            console.error('上传头像失败:', error);
            
            wx.showToast({
              title: '上传头像失败',
              icon: 'none'
            });
          });
      }
    });
  },

  /**
   * 导航到"我创建的"页面
   */
  navigateToMyCreated: function () {
    if (!this.data.isLoggedIn) {
      this.login();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/myCreated/myCreated'
    });
  },

  /**
   * 导航到"我参与的"页面
   */
  navigateToMyJoined: function () {
    if (!this.data.isLoggedIn) {
      this.login();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/myJoined/myJoined'
    });
  },

  /**
   * 导航到设置页面
   */
  navigateToSettings: function () {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  /**
   * 导航到意见反馈页面
   */
  navigateToFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  /**
   * 导航到关于我们页面
   */
  navigateToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  }
}); 
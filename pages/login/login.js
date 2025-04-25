// 登录页面
const userService = require('../../services/userService');

Page({
  data: {
    loading: false,
    canIUseGetUserProfile: false
  },

  onLoad() {
    // 判断用户是否可以使用 getUserProfile API
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
  },

  // 微信登录
  login() {
    this.setData({ loading: true });

    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 res.code 到后端换取 openId, sessionKey, unionId
          userService.login(res.code)
            .then(data => {
              // 保存token
              wx.setStorageSync('token', data.token);
              
              // 获取用户信息
              if (this.data.canIUseGetUserProfile) {
                this.getUserProfile();
              } else {
                this.getUserInfo();
              }
            })
            .catch(() => {
              this.setData({ loading: false });
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
            });
        } else {
          this.setData({ loading: false });
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '登录失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },

  // 获取用户信息（新版API）
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        // 更新用户信息到后端
        userService.updateUserInfo({
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          gender: res.userInfo.gender,
          city: res.userInfo.city,
          province: res.userInfo.province,
          country: res.userInfo.country
        })
          .then(() => {
            // 登录成功，跳转到首页
            this.loginSuccess();
          })
          .catch(() => {
            this.setData({ loading: false });
          });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取用户信息（旧版API）
  getUserInfo(e) {
    if (e && e.detail && e.detail.userInfo) {
      // 更新用户信息到后端
      userService.updateUserInfo({
        nickName: e.detail.userInfo.nickName,
        avatarUrl: e.detail.userInfo.avatarUrl,
        gender: e.detail.userInfo.gender,
        city: e.detail.userInfo.city,
        province: e.detail.userInfo.province,
        country: e.detail.userInfo.country
      })
        .then(() => {
          // 登录成功，跳转到首页
          this.loginSuccess();
        })
        .catch(() => {
          this.setData({ loading: false });
        });
    } else {
      this.setData({ loading: false });
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  // 登录成功后处理
  loginSuccess() {
    const app = getApp();
    app.globalData.isLoggedIn = true;
    
    // 获取跳转回的页面
    const redirect = wx.getStorageSync('redirect');
    
    if (redirect) {
      wx.removeStorageSync('redirect');
      wx.reLaunch({
        url: redirect
      });
    } else {
      wx.reLaunch({
        url: '/pages/activityList/activityList'
      });
    }
  }
}); 
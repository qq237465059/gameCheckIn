// app.js
const debugUtil = require('./utils/debugUtil');
const request = require('./utils/request');

App({
  onLaunch: function() {
    // 初始化调试工具
    debugUtil.injectTraceGlobally();
    debugUtil.initErrorHandler();
    
    // 开发模式下，覆盖微信API以解决文件操作权限问题
    if (request.isDevMode()) {
      debugUtil.overrideWxAPIs();
      
      // 为全局添加一个模拟的文件系统管理器，防止直接使用 wx.getFileSystemManager() 的情况
      this.mockFSM = this.createMockFileSystemManager();
    }
    
    // 初始化应用时执行
    this.checkLogin();
  },
  
  onShow: function() {
    // 小程序启动或从后台进入前台时触发
  },
  
  onHide: function() {
    // 小程序进入后台时触发
  },
  
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    activities: [],
    checkIns: [],
    // 模拟数据
    mockData: {
      // 用户签到记录
      checkInRecords: [
        {
          id: 'checkin_001',
          activityId: 'activity_001',
          activityName: '周末篮球友谊赛',
          checkInTime: '2023-08-15 13:45:30',
          location: '市体育中心篮球馆',
          distanceDesc: '0米',
          photoUrl: '/assets/images/basketball.jpg',
          status: 'success'
        },
        {
          id: 'checkin_002',
          activityId: 'activity_002',
          activityName: '城市定向赛',
          checkInTime: '2023-08-10 09:10:22',
          location: '中央公园入口',
          distanceDesc: '5米',
          photoUrl: '/assets/images/park.jpg',
          status: 'success'
        },
        {
          id: 'checkin_003',
          activityId: 'activity_003',
          activityName: '瑜伽交流会',
          checkInTime: '2023-08-05 18:30:15',
          location: '健身中心',
          distanceDesc: '2米',
          photoUrl: '/assets/images/yoga.jpg',
          status: 'success'
        }
      ],
      // 用户统计数据
      userStatistics: {
        totalCheckins: 15,
        createdActivities: 3,
        joinedActivities: 12,
        completedActivities: 10
      }
    }
  },
  
  checkLogin: function() {
    // 开发模式下跳过登录检查
    if (request.isDevMode()) {
      console.log('开发模式：跳过登录检查');
      // 在开发模式下设置为已登录状态，方便开发
      this.globalData.isLoggedIn = true;
      
      // 设置默认用户信息用于开发
      this.globalData.userInfo = {
        userId: 'dev_user',
        nickName: '开发者',
        avatarUrl: '/assets/images/default-avatar.png'
      };
      
      return;
    }
    
    // 检查用户是否已登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
      // 获取用户信息
      this.getUserInfo();
    } else {
      this.globalData.isLoggedIn = false;
      // 如果未登录，跳转到登录页面（除个人中心外）
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route !== 'pages/profile/profile') {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }
    }
  },
  
  getUserInfo: function() {
    // 开发模式下返回模拟数据
    if (request.isDevMode()) {
      this.globalData.userInfo = {
        userId: 'dev_user',
        nickName: '开发者',
        avatarUrl: '/assets/images/default-avatar.png',
        gender: 1,
        phone: '13888888888',
        email: 'dev@example.com'
      };
      return;
    }
    
    // 获取用户信息的方法
    wx.request({
      url: 'https://your-api.com/user/info',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          this.globalData.userInfo = res.data.data;
        } else {
          // 获取用户信息失败，可能是token过期
          wx.removeStorageSync('token');
          this.globalData.isLoggedIn = false;
        }
      },
      fail: () => {
        // 请求失败，可能是网络问题
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 创建模拟的文件系统管理器
  createMockFileSystemManager: function() {
    return {
      access: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'access:ok' });
          if (options.complete) options.complete({ errMsg: 'access:ok' });
        }, 50);
      },
      accessSync: () => { /* 无返回值 */ },
      appendFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'appendFile:ok' });
          if (options.complete) options.complete({ errMsg: 'appendFile:ok' });
        }, 50);
      },
      appendFileSync: () => { /* 无返回值 */ },
      copyFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'copyFile:ok' });
          if (options.complete) options.complete({ errMsg: 'copyFile:ok' });
        }, 50);
      },
      copyFileSync: () => { /* 无返回值 */ },
      getFileInfo: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ 
            size: 1024, 
            createTime: Date.now(),
            errMsg: 'getFileInfo:ok' 
          });
          if (options.complete) options.complete({ errMsg: 'getFileInfo:ok' });
        }, 50);
      },
      getSavedFileList: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ 
            fileList: [
              { filePath: '/mock_path/file1', createTime: Date.now() - 86400000, size: 1024 },
              { filePath: '/mock_path/file2', createTime: Date.now(), size: 2048 }
            ],
            errMsg: 'getSavedFileList:ok' 
          });
          if (options.complete) options.complete({ errMsg: 'getSavedFileList:ok' });
        }, 50);
      },
      mkdir: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'mkdir:ok' });
          if (options.complete) options.complete({ errMsg: 'mkdir:ok' });
        }, 50);
      },
      mkdirSync: () => { /* 无返回值 */ },
      readFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ 
            data: 'mock file content',
            errMsg: 'readFile:ok' 
          });
          if (options.complete) options.complete({ errMsg: 'readFile:ok' });
        }, 50);
      },
      readFileSync: () => {
        return 'mock file content';
      },
      removeSavedFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'removeSavedFile:ok' });
          if (options.complete) options.complete({ errMsg: 'removeSavedFile:ok' });
        }, 50);
      },
      rename: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'rename:ok' });
          if (options.complete) options.complete({ errMsg: 'rename:ok' });
        }, 50);
      },
      renameSync: () => { /* 无返回值 */ },
      rmdir: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'rmdir:ok' });
          if (options.complete) options.complete({ errMsg: 'rmdir:ok' });
        }, 50);
      },
      rmdirSync: () => { /* 无返回值 */ },
      saveFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ 
            savedFilePath: '/mock_saved_path/file_' + Date.now(),
            errMsg: 'saveFile:ok' 
          });
          if (options.complete) options.complete({ errMsg: 'saveFile:ok' });
        }, 50);
      },
      saveFileSync: () => {
        return '/mock_saved_path/file_' + Date.now();
      },
      stat: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ 
            stats: { 
              isDirectory: () => false,
              isFile: () => true,
              size: 1024,
              lastAccessedTime: Date.now(),
              lastModifiedTime: Date.now()
            },
            errMsg: 'stat:ok' 
          });
          if (options.complete) options.complete({ errMsg: 'stat:ok' });
        }, 50);
      },
      statSync: () => {
        return { 
          isDirectory: () => false,
          isFile: () => true,
          size: 1024,
          lastAccessedTime: Date.now(),
          lastModifiedTime: Date.now()
        };
      },
      unlink: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'unlink:ok' });
          if (options.complete) options.complete({ errMsg: 'unlink:ok' });
        }, 50);
      },
      unlinkSync: () => { /* 无返回值 */ },
      unzip: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'unzip:ok' });
          if (options.complete) options.complete({ errMsg: 'unzip:ok' });
        }, 50);
      },
      writeFile: (options) => {
        setTimeout(() => {
          if (options.success) options.success({ errMsg: 'writeFile:ok' });
          if (options.complete) options.complete({ errMsg: 'writeFile:ok' });
        }, 50);
      },
      writeFileSync: () => { /* 无返回值 */ }
    };
  }
}); 
// 用户服务
const request = require('../utils/request');
const app = getApp();

// 用户相关API
const userAPI = {
  // 登录
  login: (data) => {
    return request.post('/api/user/login', data);
  },
  
  // 登出
  logout: () => {
    return request.post('/api/user/logout');
  },
  
  // 注册
  register: (data) => {
    return request.post('/api/user/register', data);
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request.get('/api/user/info');
  },
  
  // 更新用户信息
  updateUserInfo: (data) => {
    return request.put('/api/user/info', data);
  },
  
  // 上传头像
  uploadAvatar: (filePath) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: request.getBaseUrl() + '/api/user/avatar',
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data);
            } else {
              reject(data);
            }
          } catch (error) {
            reject(error);
          }
        },
        fail: reject
      });
    });
  },
  
  // 获取用户统计信息
  getUserStatistics: () => {
    return request.get('/api/user/statistics');
  },
  
  // 重置密码
  resetPassword: (data) => {
    return request.post('/api/user/reset-password', data);
  },
  
  // 微信登录
  wxLogin: (code) => {
    return request.post('/api/user/wx-login', { code });
  }
};

// 模拟数据服务（开发阶段使用，正式环境应删除此部分）
const mockUserService = {
  // 模拟登录
  login: (data) => {
    return new Promise((resolve) => {
      console.log('模拟登录，数据:', data);
      setTimeout(() => {
        const mockUser = {
          userId: 'user_' + Date.now(),
          nickName: data.username || '测试用户',
          avatarUrl: '/assets/images/default-avatar.png',
          token: 'mock_token_' + Date.now()
        };
        
        // 保存用户信息和token
        app.globalData.userInfo = mockUser;
        wx.setStorageSync('token', mockUser.token);
        
        resolve(mockUser);
      }, 800);
    });
  },
  
  // 模拟登出
  logout: () => {
    return new Promise((resolve) => {
      console.log('模拟登出');
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  },
  
  // 模拟注册
  register: (data) => {
    return new Promise((resolve) => {
      console.log('模拟注册，数据:', data);
      setTimeout(() => {
        const mockUser = {
          userId: 'user_' + Date.now(),
          nickName: data.username || '新用户',
          avatarUrl: '/assets/images/default-avatar.png',
          token: 'mock_token_' + Date.now()
        };
        
        resolve(mockUser);
      }, 1000);
    });
  },
  
  // 模拟获取用户信息
  getUserInfo: () => {
    return new Promise((resolve) => {
      console.log('模拟获取用户信息');
      setTimeout(() => {
        // 如果已登录，返回本地用户信息
        if (app.globalData.userInfo) {
          resolve(app.globalData.userInfo);
          return;
        }
        
        // 模拟用户信息
        const mockUser = {
          userId: 'user_123456',
          nickName: '测试用户',
          avatarUrl: '/assets/images/default-avatar.png',
          gender: 1,
          phone: '1388888****',
          email: 'test@example.com'
        };
        
        resolve(mockUser);
      }, 500);
    });
  },
  
  // 模拟更新用户信息
  updateUserInfo: (data) => {
    return new Promise((resolve) => {
      console.log('模拟更新用户信息，数据:', data);
      setTimeout(() => {
        // 更新本地用户信息
        const userInfo = { ...app.globalData.userInfo, ...data };
        app.globalData.userInfo = userInfo;
        
        resolve(userInfo);
      }, 800);
    });
  },
  
  // 模拟上传头像
  uploadAvatar: (filePath) => {
    return new Promise((resolve) => {
      console.log('模拟上传头像，文件路径:', filePath);
      setTimeout(() => {
        // 实际项目中应该上传到服务器，这里直接使用本地路径
        resolve({
          avatarUrl: filePath
        });
      }, 1000);
    });
  },
  
  // 模拟获取用户统计信息
  getUserStatistics: () => {
    return new Promise((resolve) => {
      console.log('模拟获取用户统计信息');
      setTimeout(() => {
        // 检查是否有全局模拟数据
        if (app.globalData && app.globalData.mockData && app.globalData.mockData.userStatistics) {
          resolve(app.globalData.mockData.userStatistics);
          return;
        }
        
        // 否则返回默认模拟数据
        resolve({
          totalCheckins: Math.floor(Math.random() * 15) + 3,
          createdActivities: Math.floor(Math.random() * 10),
          joinedActivities: Math.floor(Math.random() * 20) + 5,
          completedActivities: Math.floor(Math.random() * 15) + 3
        });
      }, 500);
    });
  },
  
  // 模拟重置密码
  resetPassword: (data) => {
    return new Promise((resolve) => {
      console.log('模拟重置密码，数据:', data);
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  },
  
  // 模拟微信登录
  wxLogin: (code) => {
    return new Promise((resolve) => {
      console.log('模拟微信登录，code:', code);
      setTimeout(() => {
        const mockUser = {
          userId: 'wx_user_' + Date.now(),
          nickName: '微信用户',
          avatarUrl: '/assets/images/default-avatar.png',
          token: 'wx_token_' + Date.now()
        };
        
        // 保存用户信息和token
        app.globalData.userInfo = mockUser;
        wx.setStorageSync('token', mockUser.token);
        
        resolve(mockUser);
      }, 800);
    });
  }
};

// 根据环境决定使用真实服务还是模拟服务
// 开发模式下始终使用模拟服务
const isDevMode = () => {
  try {
    return require('./request').isDevMode();
  } catch (e) {
    return true; // 如果出错，默认为开发模式
  }
};

module.exports = isDevMode() ? mockUserService : userAPI; 
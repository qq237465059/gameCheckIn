// 打卡服务类
const request = require('../utils/request');

// 获取app实例的安全方法
const getAppInstance = () => {
  try {
    if (typeof getApp === 'function') {
      return getApp();
    }
    return null;
  } catch (error) {
    console.warn('获取应用实例失败:', error);
    return null;
  }
};

/**
 * 获取用户的打卡记录列表
 * @param {Object} params 查询参数
 * @returns {Promise} 打卡记录列表
 */
const getCheckInRecords = (params = {}) => {
  // 开发模式下，返回模拟数据
  if (request.isDevMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = getAppInstance();
        const mockData = app && app.globalData && app.globalData.mockData ? 
                        app.globalData.mockData.checkInRecords || [] : [];
        
        // 分页处理
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = mockData.slice(start, end);
        
        resolve({
          items: items,
          total: mockData.length,
          hasMore: end < mockData.length
        });
      }, 500);
    });
  }
  
  return request.get('/check-ins', params);
};

/**
 * 获取打卡详情
 * @param {String} id 打卡记录ID
 * @returns {Promise} 打卡详情
 */
const getCheckInDetail = (id) => {
  // 开发模式下，返回模拟数据
  if (request.isDevMode()) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const app = getAppInstance();
        const mockData = app && app.globalData && app.globalData.mockData ? 
                        app.globalData.mockData.checkInRecords || [] : [];
        const checkIn = mockData.find(item => item.id === id);
        
        if (checkIn) {
          resolve(checkIn);
        } else {
          reject(new Error('打卡记录不存在'));
        }
      }, 300);
    });
  }
  
  return request.get(`/check-ins/${id}`);
};

/**
 * 提交打卡
 * @param {String} activityId 活动ID
 * @param {Object} checkInData 打卡数据
 * @returns {Promise} 打卡结果
 */
const submitCheckIn = (activityId, checkInData) => {
  // 开发模式下，模拟提交打卡
  if (request.isDevMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = getAppInstance();
        let mockData = [];
        
        if (app && app.globalData && app.globalData.mockData) {
          mockData = app.globalData.mockData.checkInRecords || [];
        }
        
        // 创建新的签到记录
        const newCheckIn = {
          id: 'checkin_' + Date.now(),
          activityId: activityId,
          activityName: '模拟活动-' + activityId,
          checkInTime: new Date().toLocaleString(),
          location: checkInData.location?.name || '未知位置',
          distanceDesc: checkInData.distance ? `${checkInData.distance}米` : '未知',
          photoUrl: checkInData.photoUrl || '',
          status: 'success'
        };
        
        // 添加到模拟数据中
        mockData.unshift(newCheckIn);
        
        if (app && app.globalData && app.globalData.mockData) {
          app.globalData.mockData.checkInRecords = mockData;
          
          // 更新签到统计
          if (app.globalData.mockData.userStatistics) {
            app.globalData.mockData.userStatistics.totalCheckins += 1;
          }
        }
        
        resolve(newCheckIn);
      }, 800);
    });
  }
  
  return request.post(`/activities/${activityId}/check-in`, checkInData);
};

/**
 * 获取活动的打卡统计
 * @param {String} activityId 活动ID
 * @returns {Promise} 打卡统计信息
 */
const getActivityCheckInStats = (activityId) => {
  // 开发模式下，返回模拟数据
  if (request.isDevMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalParticipants: 10,
          checkedInCount: 6,
          checkInRate: '60%'
        });
      }, 300);
    });
  }
  
  return request.get(`/activities/${activityId}/check-in/stats`);
};

/**
 * 上传打卡照片
 * @param {String} activityId 活动ID
 * @param {String} tempFilePath 临时文件路径
 * @returns {Promise} 上传结果
 */
const uploadCheckInPhoto = (activityId, tempFilePath) => {
  return new Promise((resolve, reject) => {
    try {
      // 检查是否在开发模式
      const isDevMode = request.isDevMode();
      
      // 非开发模式下检查token是否存在
      const token = wx.getStorageSync('token');
      if (!isDevMode && !token) {
        // token不存在，先跳转到登录页
        const app = getAppInstance();
        if (app && app.globalData) {
          app.globalData.isLoggedIn = false;
        }
        
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 2000
        });
        
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
        
        return reject(new Error('未登录或登录已过期'));
      }
      
      // 在开发模式下，不使用token也能正常上传
      const headers = isDevMode ? 
        { 'Content-Type': 'multipart/form-data' } : 
        { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };
      
      wx.uploadFile({
        url: `${request.getBaseUrl()}/api/activities/${activityId}/check-in/photo`,
        filePath: tempFilePath,
        name: 'photo',
        header: headers,
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data);
            } else if (!isDevMode && (data.code === 401 || (data.message && (data.message.includes('token expired') || data.message.includes('INVALID_LOGIN'))))) {
              // 非开发模式下处理token过期
              const app = getAppInstance();
              if (app && app.globalData) {
                app.globalData.isLoggedIn = false;
              }
              wx.removeStorageSync('token');
              
              wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000
              });
              
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
              
              reject(new Error('登录已过期'));
            } else {
              // 其他业务错误
              wx.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              });
              reject(data);
            }
          } catch (error) {
            console.error('上传照片解析响应失败:', error);
            
            // 开发模式下，即使解析失败也尝试继续
            if (isDevMode) {
              resolve({ photoUrl: tempFilePath });
            } else {
              reject(error);
            }
          }
        },
        fail: (err) => {
          console.error('上传照片失败:', err);
          
          // 非开发模式下检查是否是token过期错误
          if (!isDevMode && err.errMsg && (err.errMsg.includes('INVALID_LOGIN') || err.errMsg.includes('access_token expired'))) {
            const app = getAppInstance();
            if (app && app.globalData) {
              app.globalData.isLoggedIn = false;
            }
            wx.removeStorageSync('token');
            
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000
            });
            
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 1500);
          } else {
            // 开发模式下提供模拟成功响应
            if (isDevMode) {
              console.warn('开发模式：模拟上传照片成功');
              resolve({ photoUrl: tempFilePath });
              return;
            }
            
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          }
          
          // 非开发模式且非模拟成功的情况下才真正reject
          if (!isDevMode) {
            reject(err);
          }
        }
      });
    } catch (error) {
      console.error('上传照片调用失败:', error);
      
      // 在开发模式下，即使出错也返回成功
      if (request.isDevMode()) {
        resolve({ photoUrl: tempFilePath });
      } else {
        reject(error);
      }
    }
  });
};

/**
 * 上传人脸识别数据
 * @param {String} activityId 活动ID
 * @param {Object} faceData 人脸数据
 * @returns {Promise} 上传结果
 */
const uploadFaceData = (activityId, faceData) => {
  // 开发模式下，模拟成功上传
  if (request.isDevMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          faceVerified: true
        });
      }, 500);
    });
  }
  
  return request.post(`/activities/${activityId}/check-in/face`, faceData);
};

/**
 * 获取用户签到状态
 * @param {String} activityId 活动ID 
 * @returns {Promise} 签到状态
 */
const getCheckInStatus = (activityId) => {
  // 开发模式下，模拟签到状态
  if (request.isDevMode()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const app = getAppInstance();
        const mockData = app && app.globalData && app.globalData.mockData ? 
                         app.globalData.mockData.checkInRecords || [] : [];
        const checkIn = mockData.find(item => item.activityId === activityId);
        
        if (checkIn) {
          resolve({
            hasCheckedIn: true,
            checkInTime: checkIn.checkInTime,
            distance: parseInt(checkIn.distanceDesc),
            photoUrl: checkIn.photoUrl
          });
        } else {
          resolve({
            hasCheckedIn: false
          });
        }
      }, 300);
    });
  }
  
  return request.get(`/activities/${activityId}/check-in/status`);
};

module.exports = {
  getCheckInRecords,
  getCheckInDetail,
  submitCheckIn,
  getActivityCheckInStats,
  uploadCheckInPhoto,
  uploadFaceData,
  getCheckInStatus
}; 
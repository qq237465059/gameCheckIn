// 位置相关工具函数

/**
 * 获取当前位置
 * @returns {Promise} 返回包含经纬度的Promise
 */
const getLocation = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        if (err.errMsg.indexOf('auth deny') >= 0) {
          wx.showModal({
            title: '提示',
            content: '需要获取您的地理位置才能打卡，请在设置中允许授权',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '获取位置信息失败',
            icon: 'none'
          });
        }
        reject(err);
      }
    });
  });
};

/**
 * 计算两点之间的距离（米）
 * @param {Object} point1 第一个点的经纬度 {latitude, longitude}
 * @param {Object} point2 第二个点的经纬度 {latitude, longitude}
 * @returns {Number} 两点之间的距离（米）
 */
const calculateDistance = (point1, point2) => {
  const EARTH_RADIUS = 6378137.0; // 地球半径
  const toRadians = (d) => d * Math.PI / 180.0;
  
  const lat1 = toRadians(point1.latitude);
  const lng1 = toRadians(point1.longitude);
  const lat2 = toRadians(point2.latitude);
  const lng2 = toRadians(point2.longitude);
  
  const dlat = lat2 - lat1;
  const dlng = lng2 - lng1;
  
  const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + 
           Math.cos(lat1) * Math.cos(lat2) * 
           Math.sin(dlng / 2) * Math.sin(dlng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS * c;
};

/**
 * 检查是否在打卡范围内
 * @param {Object} currentLocation 当前位置 {latitude, longitude}
 * @param {Object} targetLocation 目标位置 {latitude, longitude}
 * @param {Number} range 打卡范围（米），默认1000米
 * @returns {Boolean} 是否在范围内
 */
const isInCheckInRange = (currentLocation, targetLocation, range = 1000) => {
  const distance = calculateDistance(currentLocation, targetLocation);
  return distance <= range;
};

/**
 * 显示位置在地图上
 * @param {Object} location 位置 {latitude, longitude, name}
 */
const openLocation = (location) => {
  wx.openLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.name || '打卡地点',
    scale: 18
  });
};

// 位置工具类
const locationUtil = {
  /**
   * 计算两个坐标点之间的距离（米）
   * @param {Object} point1 坐标点1 {latitude, longitude}
   * @param {Object} point2 坐标点2 {latitude, longitude}
   * @returns {Number} 距离，单位：米
   */
  getDistance: function(point1, point2) {
    if (!point1 || !point2) return 0;
    
    const lat1 = point1.latitude;
    const lng1 = point1.longitude;
    const lat2 = point2.latitude;
    const lng2 = point2.longitude;
    
    // 地球半径，单位：米
    const EARTH_RADIUS = 6378137;
    
    // 将角度转换为弧度
    const toRad = (d) => {
      return d * Math.PI / 180.0;
    };
    
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);
    const deltaLat = radLat1 - radLat2;
    const deltaLng = toRad(lng1) - toRad(lng2);
    
    const s = 2 * Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(deltaLat / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)
      )
    );
    
    // 计算距离（米）
    const distance = s * EARTH_RADIUS;
    
    return Math.round(distance);
  },
  
  /**
   * 获取定位信息
   * @param {Object} options 定位选项
   * @returns {Promise} Promise对象
   */
  getLocation: function(options = {}) {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: options.type || 'gcj02',
        altitude: options.altitude || false,
        isHighAccuracy: options.isHighAccuracy || false,
        highAccuracyExpireTime: options.highAccuracyExpireTime || 3000,
        success: resolve,
        fail: (error) => {
          console.error('获取位置失败:', error);
          reject(error);
        }
      });
    });
  },
  
  /**
   * 打开位置选择器
   * @returns {Promise} Promise对象
   */
  chooseLocation: function() {
    return new Promise((resolve, reject) => {
      wx.chooseLocation({
        success: resolve,
        fail: (error) => {
          console.error('选择位置失败:', error);
          reject(error);
        }
      });
    });
  },
  
  /**
   * 在地图上打开位置
   * @param {Object} location 位置信息 {latitude, longitude, name, address}
   */
  openLocation: function(location) {
    if (!location || !location.latitude || !location.longitude) {
      wx.showToast({
        title: '位置信息不完整',
        icon: 'none'
      });
      return;
    }
    
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || '',
      address: location.address || '',
      scale: 18
    });
  },
  
  /**
   * 检查用户是否在指定范围内
   * @param {Object} userLocation 用户位置 {latitude, longitude}
   * @param {Object} targetLocation 目标位置 {latitude, longitude}
   * @param {Number} range 范围，单位：米
   * @returns {Boolean} 是否在范围内
   */
  isInRange: function(userLocation, targetLocation, range) {
    if (!userLocation || !targetLocation || !range) return false;
    
    const distance = this.getDistance(userLocation, targetLocation);
    return distance <= range;
  },
  
  /**
   * 获取位置描述（使用距离信息）
   * @param {Number} distance 距离，单位：米
   * @returns {String} 距离描述
   */
  getDistanceDesc: function(distance) {
    if (distance === null || distance === undefined) return '';
    
    if (distance < 10) {
      return '就在附近';
    } else if (distance < 1000) {
      return `${distance}米`;
    } else {
      return `${(distance / 1000).toFixed(1)}公里`;
    }
  },
  
  /**
   * 定位授权检查
   * @returns {Promise} Promise对象
   */
  checkLocationAuth: function() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userLocation']) {
            // 已授权
            resolve(true);
          } else if (res.authSetting['scope.userLocation'] === false) {
            // 已拒绝授权
            wx.showModal({
              title: '提示',
              content: '需要获取您的地理位置，请确认授权',
              showCancel: false,
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting({
                    success: (settingRes) => {
                      if (settingRes.authSetting['scope.userLocation']) {
                        resolve(true);
                      } else {
                        reject(new Error('用户拒绝授权'));
                      }
                    },
                    fail: reject
                  });
                }
              }
            });
          } else {
            // 首次授权
            resolve(false);
          }
        },
        fail: reject
      });
    });
  }
};

module.exports = locationUtil; 
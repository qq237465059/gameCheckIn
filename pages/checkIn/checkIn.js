// 活动签到页面
const app = getApp();
const activityService = require('../../services/activityService');
const checkInService = require('../../services/checkInService');
const dateUtil = require('../../utils/dateUtil');
const locationUtil = require('../../utils/locationUtil');

// 安全获取Trace对象的函数
const getTrace = function() {
  // 优先从wx全局对象获取
  if (typeof wx !== 'undefined' && wx.Trace) {
    return wx.Trace;
  }
  
  // 其次从app对象获取
  if (app && app.Trace) {
    return app.Trace;
  }
  
  // 都不存在则返回一个空对象，避免调用时报错
  return {
    log: function(msg) { console.log(msg); },
    error: function(msg, err) { console.error(msg, err); },
    warn: function(msg) { console.warn(msg); },
    info: function(msg) { console.info(msg); }
  };
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activityId: null,
    loading: true,
    activity: null,
    userLocation: null,
    checkInStatus: false,
    checkInTime: "",
    distance: null,
    distanceDesc: "",
    isInRange: false,
    faceVerified: false,
    photoUrl: "",
    canCheckIn: false,
    errorMessage: "",
    showError: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.activityId) {
      this.setData({
        activityId: options.activityId
      });
      this.loadActivityDetail();
    } else {
      this.showError('活动ID不存在');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 获取位置信息
    this.refreshLocation();
  },

  /**
   * 处理错误
   */
  handleError: function(error, message) {
    console.error(message, error);
    
    // 安全获取Trace对象并记录错误
    const trace = getTrace();
    trace.error(message, error);
    
    this.showError(message);
  },

  /**
   * 显示错误信息
   */
  showError: function(message) {
    this.setData({
      errorMessage: message,
      showError: true
    });
    
    wx.showToast({
      title: message,
      icon: 'none'
    });
  },

  /**
   * 加载活动详情
   */
  loadActivityDetail: function () {
    this.setData({ loading: true });
    
    // 获取活动详情
    activityService.getActivityDetail(this.data.activityId)
      .then(activity => {
        // 格式化时间
        activity.formattedTime = dateUtil.formatDateTime(new Date(activity.activityTime));
        
        this.setData({
          activity: activity,
          loading: false
        });
        
        // 加载签到状态
        this.loadCheckInStatus();
        
        // 检查位置
        if (this.data.userLocation) {
          this.checkLocation();
        }
      })
      .catch(error => {
        this.handleError(error, '获取活动详情失败');
        this.setData({ 
          loading: false,
          activity: null
        });
      });
  },

  /**
   * 加载签到状态
   */
  loadCheckInStatus: function () {
    checkInService.getCheckInStatus(this.data.activityId)
      .then(result => {
        if (result.hasCheckedIn) {
          this.setData({
            checkInStatus: true,
            checkInTime: dateUtil.formatDateTime(new Date(result.checkInTime)),
            distanceDesc: result.distance ? `${result.distance}米` : '未记录'
          });
        } else {
          this.setData({
            checkInStatus: false
          });
        }
      })
      .catch(error => {
        this.handleError(error, '获取签到状态失败');
        this.setData({
          checkInStatus: false
        });
      });
  },

  /**
   * 刷新位置信息
   */
  refreshLocation: function () {
    wx.showLoading({
      title: '获取位置中...',
    });
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude
        };
        
        // 直接使用获取到的位置，不需要调用chooseLocation
        location.name = '当前位置';
        
        this.setData({
          userLocation: location
        });
        
        if (this.data.activity) {
          this.checkLocation();
        }
        
        wx.hideLoading();
      },
      fail: (error) => {
        this.handleError(error, '获取位置失败，请检查定位权限');
        wx.hideLoading();
      }
    });
  },

  /**
   * 手动选择位置
   */
  chooseLocation: function() {
    wx.chooseLocation({
      success: (res) => {
        if (res.name || res.address) {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude,
            name: res.name || res.address,
            address: res.address
          };
          
          this.setData({
            userLocation: location
          });
          
          if (this.data.activity) {
            this.checkLocation();
          }
        }
      },
      fail: (error) => {
        this.handleError(error, '选择位置失败');
      }
    });
  },

  /**
   * 检查位置是否在签到范围内
   */
  checkLocation: function () {
    if (!this.data.userLocation || !this.data.activity || !this.data.activity.checkInLocation) {
      return;
    }
    
    const distance = locationUtil.calculateDistance(
      this.data.userLocation.latitude,
      this.data.userLocation.longitude,
      this.data.activity.checkInLocation.latitude,
      this.data.activity.checkInLocation.longitude
    );
    
    const isInRange = distance <= this.data.activity.locationRange;
    
    this.setData({
      distance: distance,
      distanceDesc: `${distance}米`,
      isInRange: isInRange
    });
    
    this.updateCheckInStatus();
  },

  /**
   * 更新能否签到的状态
   */
  updateCheckInStatus: function () {
    let canCheckIn = this.data.isInRange;
    
    // 如果需要人脸识别，检查是否已完成
    if (this.data.activity && this.data.activity.needFace) {
      canCheckIn = canCheckIn && this.data.faceVerified;
    }
    
    // 如果需要照片，检查是否已上传
    if (this.data.activity && this.data.activity.needPhoto) {
      canCheckIn = canCheckIn && !!this.data.photoUrl;
    }
    
    this.setData({
      canCheckIn: canCheckIn
    });
  },

  /**
   * 查看活动地点
   */
  viewActivityLocation: function () {
    if (this.data.activity && this.data.activity.checkInLocation) {
      wx.openLocation({
        latitude: this.data.activity.checkInLocation.latitude,
        longitude: this.data.activity.checkInLocation.longitude,
        name: this.data.activity.activityLocation || '活动地点',
        scale: 18
      });
    } else {
      this.showError('未设置活动地点');
    }
  },

  /**
   * 开始人脸识别
   */
  startFaceVerify: function () {
    wx.showLoading({
      title: '初始化人脸识别...',
    });
    
    // 调用人脸识别 API
    // 实际项目中应该调用真实的人脸识别SDK或API
    const activityId = this.data.activityId;
    const faceData = {
      timestamp: Date.now(),
      userId: app.globalData.userInfo ? app.globalData.userInfo.userId : ''
    };
    
    checkInService.uploadFaceData(activityId, faceData)
      .then(result => {
        wx.hideLoading();
        
        if (result.faceVerified) {
          this.setData({
            faceVerified: true
          });
          
          this.updateCheckInStatus();
          
          wx.showToast({
            title: '人脸识别成功',
            icon: 'success'
          });
        } else {
          this.showError('人脸识别失败，请重试');
        }
      })
      .catch(error => {
        wx.hideLoading();
        this.handleError(error, '人脸识别失败');
      });
  },

  /**
   * 选择照片
   */
  choosePhoto: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        wx.showLoading({
          title: '上传照片中...',
        });
        
        // 上传照片
        checkInService.uploadCheckInPhoto(this.data.activityId, tempFilePath)
          .then(result => {
            wx.hideLoading();
            
            this.setData({
              photoUrl: result.photoUrl || tempFilePath
            });
            
            this.updateCheckInStatus();
            
            wx.showToast({
              title: '照片上传成功',
              icon: 'success'
            });
          })
          .catch(error => {
            wx.hideLoading();
            this.handleError(error, '照片上传失败');
          });
      }
    });
  },

  /**
   * 预览照片
   */
  previewPhoto: function () {
    if (this.data.photoUrl) {
      wx.previewImage({
        urls: [this.data.photoUrl],
        current: this.data.photoUrl
      });
    }
  },

  /**
   * 删除照片
   */
  deletePhoto: function () {
    this.setData({
      photoUrl: ""
    });
    
    this.updateCheckInStatus();
    
    wx.showToast({
      title: '已删除照片',
      icon: 'success'
    });
  },

  /**
   * 提交签到
   */
  submitCheckIn: function () {
    if (!this.data.canCheckIn) {
      let message = '请完成所有签到要求';
      
      if (!this.data.isInRange) {
        message = '您不在签到范围内';
      } else if (this.data.activity.needFace && !this.data.faceVerified) {
        message = '请先完成人脸识别';
      } else if (this.data.activity.needPhoto && !this.data.photoUrl) {
        message = '请先上传签到照片';
      }
      
      this.showError(message);
      return;
    }
    
    wx.showLoading({
      title: '提交签到中...',
    });
    
    const checkInData = {
      activityId: this.data.activityId,
      location: this.data.userLocation,
      distance: this.data.distance,
      photoUrl: this.data.photoUrl,
      faceVerified: this.data.faceVerified
    };
    
    checkInService.submitCheckIn(this.data.activityId, checkInData)
      .then(result => {
        wx.hideLoading();
        wx.showToast({
          title: '签到成功',
          icon: 'success'
        });
        
        // 更新签到状态
        this.setData({
          checkInStatus: true,
          checkInTime: dateUtil.formatDateTime(new Date())
        });
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(error => {
        wx.hideLoading();
        this.handleError(error, '签到失败，请重试');
      });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { activity, activityId } = this.data;
    
    return {
      title: activity ? `邀请你参加: ${activity.activityName}` : '邀请你参加活动',
      path: `/pages/activityDetail/activityDetail?id=${activityId}`,
      imageUrl: '/assets/images/share-activity.png'
    };
  }
}); 
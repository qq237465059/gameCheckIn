// 活动签到页面
const app = getApp();
const activityService = require('../../services/activityService');
const checkInService = require('../../services/checkInService');
const dateUtil = require('../../utils/dateUtil');
const locationUtil = require('../../utils/locationUtil');

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
    canCheckIn: false
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
      wx.showToast({
        title: '活动ID不存在',
        icon: 'none'
      });
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
        console.error('获取活动详情失败:', error);
        this.setData({ 
          loading: false,
          activity: null
        });
        
        wx.showToast({
          title: '获取活动详情失败',
          icon: 'none'
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
        console.error('获取签到状态失败:', error);
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
        
        // 获取位置名称
        wx.chooseLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          complete: (result) => {
            if (result.errMsg === 'chooseLocation:ok') {
              location.name = result.name || result.address;
              location.address = result.address;
            }
            
            this.setData({
              userLocation: location
            });
            
            if (this.data.activity) {
              this.checkLocation();
            }
            
            wx.hideLoading();
          }
        });
      },
      fail: (error) => {
        console.error('获取位置失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '获取位置失败，请检查定位权限',
          icon: 'none'
        });
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
    if (this.data.activity.needFace) {
      canCheckIn = canCheckIn && this.data.faceVerified;
    }
    
    // 如果需要照片，检查是否已上传
    if (this.data.activity.needPhoto) {
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
      wx.showToast({
        title: '未设置活动地点',
        icon: 'none'
      });
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
    setTimeout(() => {
      wx.hideLoading();
      // 模拟人脸识别成功
      this.setData({
        faceVerified: true
      });
      
      this.updateCheckInStatus();
      
      wx.showToast({
        title: '人脸识别成功',
        icon: 'success'
      });
    }, 1500);
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
        this.setData({
          photoUrl: tempFilePath
        });
        
        this.updateCheckInStatus();
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
  },

  /**
   * 提交签到
   */
  submitCheckIn: function () {
    if (!this.data.canCheckIn) {
      wx.showToast({
        title: '请完成所有签到要求',
        icon: 'none'
      });
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
    
    checkInService.submitCheckIn(checkInData)
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
        
        // 刷新数据
        this.loadCheckInStatus();
      })
      .catch(error => {
        console.error('签到失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: error.message || '签到失败，请重试',
          icon: 'none'
        });
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
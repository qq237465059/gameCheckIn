// 打卡详情页面
const activityService = require('../../services/activityService');
const checkInService = require('../../services/checkInService');
const locationUtil = require('../../utils/location');
const util = require('../../utils/util');

Page({
  data: {
    id: '',
    activity: null,
    checkedInUsers: [],
    notCheckedInUsers: [],
    loading: true,
    isInRange: false,
    currentLocation: null,
    showCheckInModal: false,
    checkInParams: {
      photo: '',
      faceData: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        id: options.id
      });
      this.getActivityDetail();
    } else {
      wx.showToast({
        title: '活动ID不能为空',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 获取活动详情
  getActivityDetail() {
    this.setData({ loading: true });
    
    activityService.getActivityDetail(this.data.id)
      .then(activity => {
        // 格式化时间
        activity.formattedTime = util.formatTime(activity.activityTime, 'YYYY年MM月DD日 hh:mm');
        
        // 区分已打卡和未打卡的用户
        const checkedInUsers = activity.participants.filter(p => p.checkInTime);
        const notCheckedInUsers = activity.participants.filter(p => !p.checkInTime);
        
        this.setData({
          activity,
          checkedInUsers,
          notCheckedInUsers,
          loading: false
        });
        
        // 获取当前位置，检查是否在打卡范围内
        this.checkLocation();
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({
          title: '获取活动详情失败',
          icon: 'none'
        });
      });
  },

  // 检查位置是否在打卡范围内
  checkLocation() {
    locationUtil.getLocation()
      .then(location => {
        const targetLocation = {
          latitude: this.data.activity.locationLatitude,
          longitude: this.data.activity.locationLongitude
        };
        
        const isInRange = locationUtil.isInCheckInRange(
          location, 
          targetLocation, 
          this.data.activity.locationRange || 1000
        );
        
        this.setData({
          currentLocation: location,
          isInRange
        });
      })
      .catch(err => {
        console.error('获取位置失败', err);
      });
  },

  // 显示打卡位置在地图上
  viewLocation() {
    const activity = this.data.activity;
    if (activity.locationLatitude && activity.locationLongitude) {
      locationUtil.openLocation({
        latitude: activity.locationLatitude,
        longitude: activity.locationLongitude,
        name: activity.activityLocation || '打卡地点'
      });
    } else {
      wx.showToast({
        title: '未设置打卡位置',
        icon: 'none'
      });
    }
  },

  // 打开打卡弹窗
  openCheckInModal() {
    if (!this.data.isInRange) {
      wx.showModal({
        title: '提示',
        content: '您不在打卡范围内，无法打卡！',
        showCancel: false
      });
      return;
    }
    
    this.setData({
      showCheckInModal: true,
      checkInParams: {
        photo: '',
        faceData: ''
      }
    });
  },

  // 关闭打卡弹窗
  closeCheckInModal() {
    this.setData({
      showCheckInModal: false
    });
  },

  // 拍照打卡
  takePhoto() {
    if (!this.data.activity.needPhoto) {
      return;
    }
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.setData({
          'checkInParams.photo': res.tempFilePaths[0]
        });
      }
    });
  },

  // 人脸识别
  faceRecognition() {
    if (!this.data.activity.needFace) {
      return;
    }
    
    // 调用微信人脸识别API
    wx.startFacialRecognitionVerify({
      name: '游戏打卡',
      success: (res) => {
        console.log('人脸识别成功', res);
        this.setData({
          'checkInParams.faceData': 'verified'
        });
        wx.showToast({
          title: '人脸识别成功'
        });
      },
      fail: (err) => {
        console.error('人脸识别失败', err);
        wx.showToast({
          title: '人脸识别失败',
          icon: 'none'
        });
      }
    });
  },

  // 提交打卡
  submitCheckIn() {
    const { activity, checkInParams, currentLocation } = this.data;
    
    // 验证打卡条件
    if (activity.needPhoto && !checkInParams.photo) {
      wx.showToast({
        title: '请拍照上传',
        icon: 'none'
      });
      return;
    }
    
    if (activity.needFace && !checkInParams.faceData) {
      wx.showToast({
        title: '请完成人脸识别',
        icon: 'none'
      });
      return;
    }
    
    // 构建打卡数据
    const checkInData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude
    };
    
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 上传照片（如果需要）
    const uploadPhoto = () => {
      if (activity.needPhoto && checkInParams.photo) {
        return checkInService.uploadCheckInPhoto(activity.id, checkInParams.photo);
      }
      return Promise.resolve(null);
    };
    
    // 上传人脸数据（如果需要）
    const uploadFace = () => {
      if (activity.needFace && checkInParams.faceData) {
        return checkInService.uploadFaceData(activity.id, { faceData: checkInParams.faceData });
      }
      return Promise.resolve(null);
    };
    
    // 执行打卡流程
    Promise.all([uploadPhoto(), uploadFace()])
      .then(([photoRes, faceRes]) => {
        if (photoRes) {
          checkInData.photoUrl = photoRes.url;
        }
        
        if (faceRes) {
          checkInData.faceVerified = true;
        }
        
        return checkInService.submitCheckIn(activity.id, checkInData);
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '打卡成功'
        });
        
        this.closeCheckInModal();
        
        // 刷新页面数据
        setTimeout(() => {
          this.getActivityDetail();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('打卡失败', err);
        wx.showToast({
          title: '打卡失败，请重试',
          icon: 'none'
        });
      });
  },

  // 预览用户头像
  previewAvatar(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  }
}); 
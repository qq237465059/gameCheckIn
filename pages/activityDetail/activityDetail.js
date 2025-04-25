// 活动详情页面
const activityService = require('../../services/activityService');
const locationUtil = require('../../utils/location');
const util = require('../../utils/util');
const app = getApp();

// 错误处理函数
function handleError(context, error) {
  console.error(`[${context}]`, error);
  // 如果存在Trace对象，则使用它记录错误
  if (app && app.Trace) {
    app.Trace.error(`[${context}]`, error);
  }
  
  wx.showToast({
    title: '操作失败，请重试',
    icon: 'none'
  });
}

Page({
  data: {
    id: '',
    type: '', // create: 创建活动, 空: 查看活动
    readonly: false, // 是否只读模式
    activity: null,
    loading: true,
    participants: [],
    showJoinModal: false,
    isEdit: false, // 是否处于编辑模式
    isCreator: false, // 是否是创建者
    isParticipant: false, // 是否已参加
    joinParams: {
      checkInLocation: null,
      checkInRange: 1000 // 默认1公里
    },
    activityId: '', // 活动ID
    formData: {
      name: '',
      description: '',
      startTime: '请选择时间',
      endTime: '请选择时间',
      location: '请选择地点',
      reserveStartTime: '请选择时间',
      reserveEndTime: '请选择时间',
      faceRequired: false,
      photoRequired: false
    },
    checkInRanges: [50, 100, 200, 500, 1000],
    checkInRangeIndex: 1, // 默认选中100米
    currentDate: '',
    minDate: '',
    maxDate: '',
    isModalShow: false, // 是否显示加入活动弹窗
    currentUser: null,
    checkInLocation: {
      name: '选择位置',
      latitude: 0,
      longitude: 0
    }
  },

  // 错误处理方法
  onError: function(error) {
    handleError('activityDetail', error);
  },

  onLoad(options) {
    try {
      this.setData({
        id: options.id || '',
        type: options.type || '',
        readonly: options.readonly === 'true'
      });

      if (this.data.type === 'create') {
        // 创建活动模式
        this.setData({
          loading: false,
          activity: {
            activityName: '',
            activityDesc: '',
            activityTime: '',
            activityLocation: '',
            locationLatitude: '',
            locationLongitude: '',
            locationRange: 1000,
            needFace: false,
            needPhoto: false,
            reserveTimeStart: '',
            reserveTimeEnd: '',
            participants: []
          },
          isCreator: true
        });
      } else if (this.data.id) {
        // 查看活动详情模式
        this.getActivityDetail();
      } else {
        wx.showToast({
          title: '参数错误',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }

      // 获取当前日期
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      
      const currentDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      const minDate = currentDate;
      const nextYear = year + 1;
      const maxDate = `${nextYear}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      this.setData({
        currentDate,
        minDate,
        maxDate
      });

      // 获取当前用户信息
      const currentUser = app.globalData.userInfo;
      
      this.setData({
        currentUser: currentUser
      });
    } catch (error) {
      handleError('onLoad', error);
    }
  },

  // 获取活动详情
  getActivityDetail() {
    try {
      this.setData({ loading: true });
      
      // 使用静态数据模拟API请求
      setTimeout(() => {
        // 静态数据
        const mockActivity = {
          id: this.data.id,
          activityName: '周末篮球友谊赛',
          activityDesc: '周末一起来打篮球吧，新手友好，主要目的是交朋友，锻炼身体！欢迎大家参加，我们将分组进行比赛。',
          activityTime: '2023-07-15 14:00:00',
          activityLocation: '市体育中心篮球馆',
          locationLatitude: 30.274851,
          locationLongitude: 120.155426,
          locationRange: 1000,
          needFace: true,
          needPhoto: true,
          reserveTimeStart: '2023-07-10 09:00:00',
          reserveTimeEnd: '2023-07-14 18:00:00',
          status: 1, // 1: 预约中, 2: 待打卡, 3: 已完成
          creatorId: 'user123',
          creatorName: '张三',
          canJoin: true // 是否可以参加
        };
        
        // 格式化时间
        mockActivity.formattedTime = util.formatTime(mockActivity.activityTime, 'YYYY年MM月DD日 hh:mm');
        
        // 格式化预约时间
        if (mockActivity.reserveTimeStart && mockActivity.reserveTimeEnd) {
          mockActivity.formattedReserveTime = util.formatDateRange(
            mockActivity.reserveTimeStart,
            mockActivity.reserveTimeEnd
          );
        }
        
        // 模拟参与者数据
        const mockParticipants = [
          {
            id: 'user123',
            name: '张三',
            avatar: '/images/avatar1.png',
            isCreator: true
          },
          {
            id: 'user456',
            name: '李四',
            avatar: '/images/avatar2.png',
            isCreator: false
          },
          {
            id: 'user789',
            name: '王五',
            avatar: '/images/avatar3.png',
            isCreator: false
          }
        ];
        
        // 判断当前用户是否是创建者
        const currentUser = app.globalData.userInfo || { id: 'user456' }; // 模拟当前用户
        const isCreator = currentUser.id === mockActivity.creatorId;
        
        // 判断当前用户是否已参加
        const isParticipant = mockParticipants.some(p => p.id === currentUser.id);
        
        this.setData({
          activity: mockActivity,
          participants: mockParticipants,
          loading: false,
          isCreator: isCreator,
          isParticipant: isParticipant
        });
      }, 1000);
    } catch (error) {
      handleError('getActivityDetail', error);
      this.setData({ loading: false });
    }
  },

  // 选择活动时间
  chooseActivityTime() {
    if (this.data.readonly) return;
    
    // 模拟日期选择器
    wx.showActionSheet({
      itemList: ['选择日期', '选择时间'],
      success: (res) => {
        // 假设用户选择了日期和时间
        const mockDate = '2023-07-20 14:00';
        this.setData({
          'activity.activityTime': mockDate,
          'activity.formattedTime': util.formatTime(new Date(mockDate), 'YYYY年MM月DD日 hh:mm')
        });
      }
    });
  },

  // 选择预约时间范围
  chooseReserveTime(e) {
    if (this.data.readonly) return;
    
    const type = e.currentTarget.dataset.type; // start 或 end
    
    // 模拟日期选择器
    wx.showActionSheet({
      itemList: ['选择日期', '选择时间'],
      success: (res) => {
        // 假设用户选择了日期和时间
        const mockDate = type === 'start' ? '2023-07-15 10:00' : '2023-07-19 18:00';
        
        if (type === 'start') {
          this.setData({
            'activity.reserveTimeStart': mockDate
          });
        } else {
          this.setData({
            'activity.reserveTimeEnd': mockDate
          });
        }
        
        // 更新格式化的预约时间
        if (this.data.activity.reserveTimeStart && this.data.activity.reserveTimeEnd) {
          const formattedReserveTime = util.formatDateRange(
            this.data.activity.reserveTimeStart,
            this.data.activity.reserveTimeEnd
          );
          this.setData({
            'activity.formattedReserveTime': formattedReserveTime
          });
        }
      }
    });
  },

  // 选择活动地点
  chooseLocation() {
    if (this.data.readonly) return;
    
    // 模拟选择位置
    wx.showActionSheet({
      itemList: ['选择位置'],
      success: (res) => {
        // 假设用户选择了位置
        const mockLocation = {
          name: '市体育中心篮球馆',
          address: '杭州市西湖区体育中心路1号',
          latitude: 30.274851,
          longitude: 120.155426
        };
        
        this.setData({
          'activity.activityLocation': mockLocation.name,
          'activity.locationLatitude': mockLocation.latitude,
          'activity.locationLongitude': mockLocation.longitude
        });
      }
    });
  },

  // 切换是否需要人脸识别
  toggleNeedFace() {
    if (this.data.readonly) return;
    
    this.setData({
      'activity.needFace': !this.data.activity.needFace
    });
  },

  // 切换是否需要拍照
  toggleNeedPhoto() {
    if (this.data.readonly) return;
    
    this.setData({
      'activity.needPhoto': !this.data.activity.needPhoto
    });
  },

  // 输入框变化
  inputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`activity.${field}`]: value
    });
  },

  // 创建或更新活动
  saveActivity() {
    const activity = this.data.activity;
    
    // 数据验证
    if (!activity.activityName) {
      wx.showToast({
        title: '请输入活动名称',
        icon: 'none'
      });
      return;
    }
    
    if (!activity.activityTime) {
      wx.showToast({
        title: '请选择活动时间',
        icon: 'none'
      });
      return;
    }
    
    if (!activity.activityLocation) {
      wx.showToast({
        title: '请选择活动地点',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: this.data.type === 'create' ? '创建成功' : '更新成功',
        icon: 'success'
      });
      
      // 创建成功后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1500);
  },

  // 切换到编辑模式
  editActivity() {
    this.setData({
      isEdit: true
    });
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      isEdit: false
    });
  },

  // 显示参与弹窗
  openJoinModal() {
    // 获取当前位置作为默认打卡位置
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          showJoinModal: true,
          'joinParams.checkInLocation': {
            latitude: res.latitude,
            longitude: res.longitude,
            name: '当前位置'
          }
        });
      },
      fail: () => {
        this.setData({
          showJoinModal: true
        });
      }
    });
  },

  // 关闭参与弹窗
  closeJoinModal() {
    this.setData({
      showJoinModal: false
    });
  },

  // 选择打卡地点
  chooseCheckInLocation() {
    // 模拟选择位置
    wx.showActionSheet({
      itemList: ['选择位置'],
      success: (res) => {
        // 假设用户选择了位置
        const mockLocation = {
          name: '市体育中心篮球馆',
          address: '杭州市西湖区体育中心路1号',
          latitude: 30.274851,
          longitude: 120.155426
        };
        
        this.setData({
          'joinParams.checkInLocation': {
            name: mockLocation.name,
            address: mockLocation.address,
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude
          }
        });
      }
    });
  },

  // 修改打卡范围
  changeCheckInRange(e) {
    this.setData({
      'joinParams.checkInRange': parseInt(e.detail.value)
    });
  },

  // 参与活动
  joinActivity() {
    const { activity, joinParams } = this.data;
    
    // 验证参与条件
    if (!joinParams.checkInLocation) {
      wx.showToast({
        title: '请选择打卡地点',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '加入中...',
      mask: true
    });
    
    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新参与状态
      this.setData({
        showJoinModal: false,
        isParticipant: true
      });
      
      // 添加当前用户到参与者列表
      const currentUser = app.globalData.userInfo || {
        id: 'user_current',
        name: '当前用户',
        avatar: '/images/avatar_default.png'
      };
      
      const newParticipants = [...this.data.participants, {
        id: currentUser.id,
        name: currentUser.nickName || currentUser.name,
        avatar: currentUser.avatarUrl || currentUser.avatar,
        isCreator: false
      }];
      
      this.setData({
        participants: newParticipants
      });
      
      wx.showToast({
        title: '已成功加入活动',
        icon: 'success'
      });
    }, 1500);
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
  },

  // 查看全部参与者
  viewAllParticipants() {
    const { id } = this.data;
    wx.navigateTo({
      url: `/pages/participants/participants?id=${id}`
    });
  },

  // 用户点击右上角分享
  onShareAppMessage() {
    const { activity } = this.data;
    return {
      title: activity ? `邀请你参加: ${activity.activityName}` : '邀请你参加活动',
      path: `/pages/activityDetail/activityDetail?id=${this.data.id}`,
      imageUrl: '/images/share_bg.png' // 自定义分享图片
    };
  },

  // 页面相关的生命周期函数
  onShow: function() {
    // 页面显示时执行的逻辑
  },
  
  onHide: function() {
    // 页面隐藏时执行的逻辑
  },
  
  onUnload: function() {
    // 页面卸载时执行的逻辑
  },
  
  onPullDownRefresh: function() {
    // 下拉刷新时，重新获取活动详情
    if (this.data.id) {
      this.getActivityDetail();
      wx.stopPullDownRefresh();
    }
  }
}); 
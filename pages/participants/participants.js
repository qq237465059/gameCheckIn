// 参与者列表页面
const app = getApp();
const activityService = require('../../services/activityService');
const dateUtil = require('../../utils/dateUtil');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activityId: null,
    loading: true,
    participants: [],
    filteredParticipants: [],
    filter: 'all', // 筛选条件：all, checked, notChecked
    isCreator: false // 是否是创建者
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.activityId) {
      this.setData({
        activityId: options.activityId
      });
      this.loadParticipants();
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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadParticipants(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载参与者列表
   */
  loadParticipants: function (callback) {
    this.setData({ loading: true });
    
    activityService.getActivityParticipants(this.data.activityId)
      .then(participants => {
        // 格式化参与时间
        const formattedParticipants = participants.map(participant => {
          return {
            ...participant,
            joinTime: dateUtil.formatDateTime(new Date(participant.joinTime))
          };
        });
        
        this.setData({
          participants: formattedParticipants,
          loading: false
        });
        
        // 应用当前筛选条件
        this.applyFilter();
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        console.error('获取参与者列表失败:', error);
        wx.showToast({
          title: '获取参与者列表失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
  },

  /**
   * 设置筛选条件
   */
  setFilter: function (e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ filter });
    this.applyFilter();
  },

  /**
   * 应用筛选条件
   */
  applyFilter: function () {
    let filteredParticipants = [];
    
    switch (this.data.filter) {
      case 'checked':
        filteredParticipants = this.data.participants.filter(p => p.checkInStatus);
        break;
      case 'notChecked':
        filteredParticipants = this.data.participants.filter(p => !p.checkInStatus);
        break;
      case 'all':
      default:
        filteredParticipants = this.data.participants;
        break;
    }
    
    this.setData({ filteredParticipants });
  },

  /**
   * 预览头像
   */
  previewAvatar: function (e) {
    const url = e.currentTarget.dataset.url;
    if (url && url !== '/assets/images/default-avatar.png') {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  // 查看打卡位置
  viewLocation(e) {
    if (!this.data.isCreator) {
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    const participant = this.data.participants[index];
    
    if (participant && participant.checkInLocation) {
      wx.openLocation({
        latitude: participant.checkInLocation.latitude,
        longitude: participant.checkInLocation.longitude,
        name: participant.checkInLocation.name || '打卡位置',
        scale: 18
      });
    } else {
      wx.showToast({
        title: '未设置打卡位置',
        icon: 'none'
      });
    }
  }
}); 
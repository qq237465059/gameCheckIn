// 活动列表页面
const activityService = require('../../services/activityService');
const dateUtil = require('../../utils/dateUtil');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,       // 加载状态
    refreshing: false,   // 下拉刷新状态
    page: 1,             // 当前页码
    pageSize: 10,        // 每页数量
    hasMore: true,       // 是否有更多数据
    keyword: '',         // 搜索关键词
    activities: [],      // 活动列表
    statusFilter: 'all', // 活动状态筛选: all, reserving, ongoing, finished
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.loadActivities();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 从其他页面返回时，检查是否需要刷新数据
    if (app.globalData.needRefreshActivityList) {
      this.refreshActivities();
      app.globalData.needRefreshActivityList = false;
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.refreshActivities(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreActivities();
    }
  },

  /**
   * 加载活动列表
   */
  loadActivities: function (callback) {
    const { page, pageSize, keyword, statusFilter } = this.data;
    
    this.setData({ loading: true });
    
    activityService.getActivities({
      page,
      pageSize,
      keyword,
      status: statusFilter === 'all' ? '' : statusFilter
    })
      .then(result => {
        // 格式化活动信息
        const formattedActivities = this.formatActivities(result.items);
        
        this.setData({
          activities: formattedActivities,
          hasMore: result.hasMore,
          loading: false
        });
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      })
      .catch(error => {
        console.error('获取活动列表失败:', error);
        wx.showToast({
          title: '获取活动列表失败',
          icon: 'none'
        });
        this.setData({ 
          loading: false,
          refreshing: false 
        });
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
  },

  /**
   * 刷新活动列表
   */
  refreshActivities: function (callback) {
    this.setData({
      page: 1,
      hasMore: true,
      refreshing: true
    });
    
    this.loadActivities(() => {
      this.setData({ refreshing: false });
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  },

  /**
   * 加载更多活动
   */
  loadMoreActivities: function () {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      page: this.data.page + 1,
      loading: true
    });
    
    const { page, pageSize, keyword, statusFilter } = this.data;
    
    activityService.getActivities({
      page,
      pageSize,
      keyword,
      status: statusFilter === 'all' ? '' : statusFilter
    })
      .then(result => {
        // 格式化活动信息
        const formattedActivities = this.formatActivities(result.items);
        
        this.setData({
          activities: [...this.data.activities, ...formattedActivities],
          hasMore: result.hasMore,
          loading: false
        });
      })
      .catch(error => {
        console.error('加载更多活动失败:', error);
        this.setData({
          page: this.data.page - 1,
          loading: false
        });
      });
  },

  /**
   * 设置状态筛选器
   */
  setStatusFilter: function (e) {
    const status = e.currentTarget.dataset.status;
    
    if (status === this.data.statusFilter) return;
    
    this.setData({
      statusFilter: status,
      page: 1,
      hasMore: true
    });
    
    this.loadActivities();
  },

  /**
   * 搜索活动
   */
  searchActivities: function () {
    this.setData({
      page: 1,
      hasMore: true
    });
    
    this.loadActivities();
  },

  /**
   * 关键词输入变化
   */
  onKeywordInput: function (e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  /**
   * 清除关键词
   */
  clearKeyword: function () {
    this.setData({
      keyword: ''
    });
    
    this.searchActivities();
  },

  /**
   * 跳转到活动详情
   */
  navigateToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${id}`
    });
  },

  /**
   * 管理活动
   */
  manageActivity: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${id}&type=edit`
    });
  },

  /**
   * 参与活动
   */
  joinActivity: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${id}`
    });
  },

  /**
   * 查看活动详情
   */
  viewActivityDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activityDetail/activityDetail?id=${id}&readonly=true`
    });
  },

  /**
   * 创建活动
   */
  createActivity: function () {
    wx.navigateTo({
      url: '/pages/activityDetail/activityDetail?type=create'
    });
  },

  /**
   * 滚动刷新事件
   */
  onRefresh: function () {
    this.refreshActivities();
  },

  /**
   * 格式化活动数据
   */
  formatActivities: function (activities) {
    const currentUser = app.globalData.userInfo || {};
    
    return activities.map(activity => {
      // 格式化时间
      const formattedTime = dateUtil.formatDateTime(new Date(activity.activityTime));
      
      // 判断状态和对应的样式类
      let statusText = '';
      let statusClass = '';
      
      switch (activity.status) {
        case 1: // 预约中
          statusText = '预约中';
          statusClass = 'reserving';
          break;
        case 2: // 进行中
          statusText = '进行中';
          statusClass = 'ongoing';
          break;
        case 3: // 已结束
          statusText = '已结束';
          statusClass = 'finished';
          break;
        default:
          statusText = '未知状态';
          statusClass = '';
      }
      
      // 判断当前用户是否是创建者
      const isCreator = currentUser.userId === activity.creatorId;
      
      // 判断是否可以参加（非创建者且活动状态为预约中）
      const canJoin = !isCreator && activity.status === 1 && !activity.isParticipant;
      
      // 获取参与者头像（最多3个）
      const participantAvatars = activity.participantAvatars || [];
      
      return {
        ...activity,
        formattedTime,
        statusText,
        statusClass,
        isCreator,
        canJoin,
        participantAvatars: participantAvatars.slice(0, 3)
      };
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '一起来参加活动吧',
      path: '/pages/activityList/activityList',
      imageUrl: '/assets/images/share-activity.png'
    };
  }
}); 
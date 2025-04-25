// 活动服务
const request = require('../utils/request');
const app = getApp();

// 活动相关API
const activityAPI = {
  // 获取活动列表
  getActivities: (params) => {
    return request.get('/api/activities', params);
  },
  
  // 获取活动详情
  getActivityDetail: (activityId) => {
    return request.get(`/api/activities/${activityId}`);
  },
  
  // 创建活动
  createActivity: (activityData) => {
    return request.post('/api/activities', activityData);
  },
  
  // 更新活动
  updateActivity: (activityId, activityData) => {
    return request.put(`/api/activities/${activityId}`, activityData);
  },
  
  // 获取活动参与者列表
  getActivityParticipants: (activityId) => {
    return request.get(`/api/activities/${activityId}/participants`);
  },
  
  // 加入活动
  joinActivity: (activityId, joinData) => {
    return request.post(`/api/activities/${activityId}/join`, joinData);
  },
  
  // 取消参与活动
  cancelJoinActivity: (activityId) => {
    return request.delete(`/api/activities/${activityId}/join`);
  },
  
  // 签到活动
  checkInActivity: (activityId, checkInData) => {
    return request.post(`/api/activities/${activityId}/checkin`, checkInData);
  },
  
  // 获取我创建的活动列表
  getMyCreatedActivities: (params) => {
    return request.get('/api/user/activities/created', params);
  },
  
  // 获取我参与的活动列表
  getMyJoinedActivities: (params) => {
    return request.get('/api/user/activities/joined', params);
  },
  
  // 删除活动
  deleteActivity: (activityId) => {
    return request.delete(`/api/activities/${activityId}`);
  },
  
  // 取消活动
  cancelActivity: (activityId, reason) => {
    return request.post(`/api/activities/${activityId}/cancel`, { reason });
  },
  
  // 获取用户签到状态
  getUserCheckInStatus: (activityId, userId) => {
    return request.get(`/api/activities/${activityId}/users/${userId}/checkin-status`);
  }
};

// 模拟数据服务（开发阶段使用，正式环境应删除此部分）
const mockActivityService = {
  // 模拟获取活动列表
  getActivities: (params) => {
    return new Promise((resolve) => {
      console.log('模拟获取活动列表，参数:', params);
      setTimeout(() => {
        // 模拟数据
        const mockActivities = generateMockActivities(params);
        resolve({
          items: mockActivities,
          total: 100,
          hasMore: params.page < 5 // 假设有5页数据
        });
      }, 500);
    });
  },
  
  // 模拟获取活动详情
  getActivityDetail: (activityId) => {
    return new Promise((resolve) => {
      console.log('模拟获取活动详情，ID:', activityId);
      setTimeout(() => {
        // 模拟数据
        resolve({
          id: activityId,
          activityName: '周末篮球友谊赛',
          activityDesc: '周末一起来打篮球吧，新手友好，主要目的是交朋友，锻炼身体！欢迎大家参加，我们将分组进行比赛。',
          activityTime: '2023-08-15 14:00:00',
          activityLocation: '市体育中心篮球馆',
          locationLatitude: 30.274851,
          locationLongitude: 120.155426,
          locationRange: 1000,
          needFace: true,
          needPhoto: true,
          reserveTimeStart: '2023-08-10 09:00:00',
          reserveTimeEnd: '2023-08-14 18:00:00',
          status: 1, // 1: 预约中, 2: 进行中, 3: 已完成
          creatorId: 'user123',
          creatorName: '张三',
          creatorAvatar: '/assets/images/avatar1.png',
          participantCount: 8,
          checkedInCount: 0,
          isParticipant: false,
          canJoin: true
        });
      }, 500);
    });
  },
  
  // 模拟获取活动参与者
  getActivityParticipants: (activityId) => {
    return new Promise((resolve) => {
      console.log('模拟获取活动参与者，活动ID:', activityId);
      setTimeout(() => {
        // 模拟数据
        const participants = [
          {
            userId: 'user123',
            nickName: '张三',
            avatarUrl: '/assets/images/avatar1.png',
            joinTime: '2023-08-10 10:23:45',
            checkInStatus: true,
            checkInTime: '2023-08-15 13:45:30',
            checkInLocation: {
              name: '市体育中心篮球馆',
              latitude: 30.274851,
              longitude: 120.155426
            },
            isCreator: true
          },
          {
            userId: 'user456',
            nickName: '李四',
            avatarUrl: '/assets/images/avatar2.png',
            joinTime: '2023-08-10 11:32:18',
            checkInStatus: false,
            checkInTime: null,
            checkInLocation: {
              name: '市体育中心门口',
              latitude: 30.275632,
              longitude: 120.154812
            },
            isCreator: false
          },
          {
            userId: 'user789',
            nickName: '王五',
            avatarUrl: '/assets/images/avatar3.png',
            joinTime: '2023-08-11 09:15:22',
            checkInStatus: true,
            checkInTime: '2023-08-15 13:50:12',
            checkInLocation: {
              name: '市体育中心停车场',
              latitude: 30.273915,
              longitude: 120.156328
            },
            isCreator: false
          },
          {
            userId: 'user101',
            nickName: '赵六',
            avatarUrl: '/assets/images/avatar4.png',
            joinTime: '2023-08-12 15:43:55',
            checkInStatus: false,
            checkInTime: null,
            checkInLocation: {
              name: '市体育中心北门',
              latitude: 30.275112,
              longitude: 120.155891
            },
            isCreator: false
          }
        ];
        resolve(participants);
      }, 500);
    });
  },
  
  // 模拟创建活动
  createActivity: (activityData) => {
    return new Promise((resolve) => {
      console.log('模拟创建活动，数据:', activityData);
      setTimeout(() => {
        resolve({
          id: 'activity_' + Date.now(),
          ...activityData,
          createdAt: new Date().toISOString()
        });
      }, 800);
    });
  },
  
  // 模拟更新活动
  updateActivity: (activityId, activityData) => {
    return new Promise((resolve) => {
      console.log('模拟更新活动，ID:', activityId, '数据:', activityData);
      setTimeout(() => {
        resolve({
          id: activityId,
          ...activityData,
          updatedAt: new Date().toISOString()
        });
      }, 800);
    });
  },
  
  // 模拟加入活动
  joinActivity: (activityId, joinData) => {
    return new Promise((resolve) => {
      console.log('模拟加入活动，ID:', activityId, '数据:', joinData);
      setTimeout(() => {
        resolve({
          activityId,
          userId: app.globalData.userInfo ? app.globalData.userInfo.userId : 'current_user',
          joinTime: new Date().toISOString(),
          ...joinData
        });
      }, 800);
    });
  },
  
  // 模拟取消参与
  cancelJoinActivity: (activityId) => {
    return new Promise((resolve) => {
      console.log('模拟取消参与活动，ID:', activityId);
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  },
  
  // 模拟签到
  checkInActivity: (activityId, checkInData) => {
    return new Promise((resolve) => {
      console.log('模拟活动签到，ID:', activityId, '数据:', checkInData);
      setTimeout(() => {
        resolve({
          activityId,
          userId: app.globalData.userInfo ? app.globalData.userInfo.userId : 'current_user',
          checkInTime: new Date().toISOString(),
          ...checkInData
        });
      }, 800);
    });
  },
  
  // 模拟获取我创建的活动
  getMyCreatedActivities: (params) => {
    return new Promise((resolve) => {
      console.log('模拟获取我创建的活动，参数:', params);
      setTimeout(() => {
        const mockActivities = generateMockActivities(params, true);
        resolve({
          items: mockActivities,
          total: 20,
          hasMore: params.page < 2
        });
      }, 500);
    });
  },
  
  // 模拟获取我参与的活动
  getMyJoinedActivities: (params) => {
    return new Promise((resolve) => {
      console.log('模拟获取我参与的活动，参数:', params);
      setTimeout(() => {
        const mockActivities = generateMockActivities(params, false);
        resolve({
          items: mockActivities,
          total: 30,
          hasMore: params.page < 3
        });
      }, 500);
    });
  },
  
  // 模拟删除活动
  deleteActivity: (activityId) => {
    return new Promise((resolve) => {
      console.log('模拟删除活动，ID:', activityId);
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  },
  
  // 模拟取消活动
  cancelActivity: (activityId, reason) => {
    return new Promise((resolve) => {
      console.log('模拟取消活动，ID:', activityId, '原因:', reason);
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  },
  
  // 模拟获取用户签到状态
  getUserCheckInStatus: (activityId, userId) => {
    return new Promise((resolve) => {
      console.log('模拟获取用户签到状态，活动ID:', activityId, '用户ID:', userId);
      setTimeout(() => {
        // 随机生成签到状态
        const randomStatus = Math.random() > 0.5;
        
        if (randomStatus) {
          resolve({
            activityId,
            userId,
            checkInStatus: true,
            checkInTime: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
            checkInDistance: Math.floor(Math.random() * 800),
            photoUrl: '/assets/images/check-in-photo.jpg'
          });
        } else {
          resolve({
            activityId,
            userId,
            checkInStatus: false
          });
        }
      }, 500);
    });
  }
};

// 生成模拟活动数据
function generateMockActivities(params, isCreator = false) {
  const { page = 1, pageSize = 10, status = '' } = params;
  const activities = [];
  
  for (let i = 0; i < pageSize; i++) {
    const id = `activity_${(page - 1) * pageSize + i + 1}`;
    const activityStatus = status ? parseInt(status) : (Math.floor(Math.random() * 3) + 1);
    const participantCount = Math.floor(Math.random() * 20) + 5;
    
    activities.push({
      id,
      activityName: `测试活动 ${(page - 1) * pageSize + i + 1}`,
      activityDesc: '这是一个测试活动描述...',
      activityTime: new Date(Date.now() + 86400000 * (i % 10)).toISOString(),
      activityLocation: '测试地点' + (i % 5 + 1),
      status: activityStatus,
      participantCount,
      checkedInCount: activityStatus === 3 ? participantCount : (activityStatus === 2 ? Math.floor(participantCount / 2) : 0),
      creatorId: isCreator ? (app.globalData.userInfo ? app.globalData.userInfo.userId : 'current_user') : 'other_user',
      creatorName: isCreator ? '我' : '其他用户',
      isParticipant: !isCreator && (Math.random() > 0.5),
      participantAvatars: [
        '/assets/images/avatar1.png',
        '/assets/images/avatar2.png',
        '/assets/images/avatar3.png'
      ],
      reserveTimeStart: new Date(Date.now() - 86400000 * 5).toISOString(),
      reserveTimeEnd: new Date(Date.now() + 86400000 * 2).toISOString()
    });
  }
  
  return activities;
}

// 根据环境决定使用真实服务还是模拟服务
const USE_MOCK = true; // 开发阶段使用模拟数据

module.exports = USE_MOCK ? mockActivityService : activityAPI; 
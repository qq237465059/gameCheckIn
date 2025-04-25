// 封装网络请求
const BASE_URL = 'https://api.example.com'; // 替换为实际的API地址

// 开发模式标志 - 设置为true时跳过登录校验
const DEV_MODE = true; // 开发完成后改为false

// 请求拦截器
const requestInterceptor = (config) => {
  // 开发模式下不添加token，跳过登录校验
  if (!DEV_MODE) {
    // 添加token
    const token = wx.getStorageSync('token');
    if (token) {
      config.header = {
        ...config.header,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  return config;
};

// 响应拦截器
const responseInterceptor = (response) => {
  // 判断服务器返回的状态码
  if (response.statusCode === 200) {
    // 正常返回数据
    const data = response.data;
    if (data.code === 0) {
      return data.data;
    } else if (!DEV_MODE && data.code === 401 || data.message?.includes('token expired') || data.message?.includes('INVALID_LOGIN')) {
      // 非开发模式下处理token过期或未登录
      handleTokenExpired();
      return Promise.reject(data);
    } else {
      // 其他业务错误
      wx.showToast({
        title: data.message || '请求失败',
        icon: 'none'
      });
      return Promise.reject(data);
    }
  } else if (!DEV_MODE && response.statusCode === 401) {
    // 非开发模式下处理HTTP 401 错误
    handleTokenExpired();
    return Promise.reject(response);
  } else {
    // 其他HTTP错误
    wx.showToast({
      title: `请求错误：${response.statusCode}`,
      icon: 'none'
    });
    return Promise.reject(response);
  }
};

// 处理 token 过期
const handleTokenExpired = () => {
  // 开发模式下不处理token过期
  if (DEV_MODE) return;
  
  const app = getApp();
  // 清除本地存储的 token
  wx.removeStorageSync('token');
  // 更新全局登录状态
  app.globalData.isLoggedIn = false;
  app.globalData.userInfo = null;
  
  // 保存当前页面路径，用于登录后返回
  const pages = getCurrentPages();
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1];
    const url = '/' + currentPage.route;
    const options = currentPage.options;
    let redirectUrl = url;
    
    if (options && Object.keys(options).length > 0) {
      redirectUrl += '?';
      for (const key in options) {
        redirectUrl += `${key}=${options[key]}&`;
      }
      redirectUrl = redirectUrl.substring(0, redirectUrl.length - 1);
    }
    
    wx.setStorageSync('redirect', redirectUrl);
  }
  
  // 显示提示
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none'
  });
  
  // 跳转到登录页面
  setTimeout(() => {
    wx.redirectTo({
      url: '/pages/login/login'
    });
  }, 1500);
};

// 请求错误处理
const requestErrorHandler = (error) => {
  console.error('Request Error:', error);
  
  // 开发模式下不处理token过期错误
  if (!DEV_MODE && error && (error.errMsg?.includes('INVALID_LOGIN') || error.errMsg?.includes('token expired') || error.errMsg?.includes('access_token expired'))) {
    handleTokenExpired();
  } else {
    wx.showToast({
      title: '网络错误，请检查网络连接',
      icon: 'none'
    });
  }
  
  return Promise.reject(error);
};

// 封装请求方法
const request = (options) => {
  // 处理请求配置
  const config = requestInterceptor({
    url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
    method: options.method || 'GET',
    data: options.data,
    header: options.header || {
      'Content-Type': 'application/json'
    }
  });

  // 发起请求
  return new Promise((resolve, reject) => {
    wx.request({
      ...config,
      success: (res) => {
        try {
          const result = responseInterceptor(res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        requestErrorHandler(err);
        reject(err);
      }
    });
  });
};

// 获取基础URL
const getBaseUrl = () => {
  return BASE_URL;
};

// 获取开发模式状态
const isDevMode = () => {
  return DEV_MODE;
};

// 导出请求方法
module.exports = {
  getBaseUrl,
  isDevMode,
  get: (url, data, options = {}) => {
    return request({
      url,
      method: 'GET',
      data,
      ...options
    });
  },
  post: (url, data, options = {}) => {
    return request({
      url,
      method: 'POST',
      data,
      ...options
    });
  },
  put: (url, data, options = {}) => {
    return request({
      url,
      method: 'PUT',
      data,
      ...options
    });
  },
  delete: (url, data, options = {}) => {
    return request({
      url,
      method: 'DELETE',
      data,
      ...options
    });
  }
}; 
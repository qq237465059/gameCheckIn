// 调试工具函数

/**
 * Trace对象 - 用于微信小程序中的错误处理和调试
 */
const Trace = {
  /**
   * 记录日志
   * @param {String} message 日志信息
   * @param {Object} data 附加数据
   */
  log: function(message, data) {
    console.log(`[Trace] ${message}`, data || '');
  },
  
  /**
   * 记录错误
   * @param {String} message 错误信息
   * @param {Error} error 错误对象
   */
  error: function(message, error) {
    console.error(`[Trace Error] ${message}`, error || '');
  },
  
  /**
   * 记录警告
   * @param {String} message 警告信息
   * @param {Object} data 附加数据
   */
  warn: function(message, data) {
    console.warn(`[Trace Warning] ${message}`, data || '');
  },
  
  /**
   * 记录信息
   * @param {String} message 信息
   */
  info: function(message) {
    console.info(`[Trace Info] ${message}`);
  }
};

// 其他调试工具函数
const debugUtil = {
  // 将Trace对象导出，使其全局可用
  Trace,
  
  /**
   * 注入Trace对象到全局作用域 (谨慎使用)
   * 安全版本，避免在应用初始化前调用getApp()
   */
  injectTraceGlobally: function() {
    try {
      // 不要立即调用getApp()，而是在全局的wx对象上附加Trace对象
      if (typeof wx !== 'undefined') {
        wx.Trace = Trace;
        console.log('Trace对象已附加到wx全局对象');
      }
      
      // 延迟设置app.Trace，确保app已经初始化
      setTimeout(() => {
        try {
          if (typeof getApp === 'function') {
            const app = getApp();
            if (app) {
              app.Trace = Trace;
              console.log('Trace对象已附加到app全局对象');
            }
          }
        } catch (e) {
          console.warn('无法将Trace对象附加到app', e);
        }
      }, 100);
      
      // 兼容其他环境
      if (typeof global !== 'undefined') {
        global.Trace = Trace;
      }
    } catch (error) {
      console.warn('注入Trace对象失败:', error);
    }
  },
  
  /**
   * 初始化全局错误拦截器
   */
  initErrorHandler: function() {
    try {
      // 监听全局错误
      wx.onError(function(error) {
        Trace.error('全局错误捕获', error);
      });
      
      // 监听页面未找到错误
      wx.onPageNotFound(function(res) {
        Trace.error('页面未找到', res);
      });
      
      // 监听内存警告
      wx.onMemoryWarning(function() {
        Trace.warn('内存不足警告');
      });
    } catch (error) {
      console.warn('初始化错误处理器失败:', error);
    }
  },

  /**
   * 覆盖微信API以解决开发模式下的权限问题
   */
  overrideWxAPIs: function() {
    try {
      // 备份原始方法
      const originalWx = {};
      
      // 需要覆盖的文件相关API
      const fileAPIs = [
        'saveFile', 'getFileInfo', 'getSavedFileList', 'getSavedFileInfo',
        'removeSavedFile', 'openDocument', 'getFileSystemManager',
        'writeFile', 'readFile', 'writeFileSync', 'readFileSync',
        'accessSync', 'access', 'appendFile', 'appendFileSync'
      ];
      
      // 备份原始方法并覆盖
      fileAPIs.forEach(api => {
        if (wx[api]) {
          originalWx[api] = wx[api];
          wx[api] = function(options) {
            console.log(`Mock ${api} called with:`, options);
            
            // 模拟成功回调
            if (options && options.success) {
              setTimeout(() => {
                const mockResult = debugUtil.getMockResultForAPI(api, options);
                options.success(mockResult);
              }, 100);
            }
            
            // 如果有complete回调也执行
            if (options && options.complete) {
              setTimeout(() => {
                options.complete({ errMsg: `${api}:ok` });
              }, 150);
            }
            
            // 如果是同步API，返回模拟结果
            if (api.endsWith('Sync')) {
              return debugUtil.getMockResultForAPI(api, options);
            }
          };
        }
      });
      
      // 覆盖上传文件API
      if (wx.uploadFile) {
        originalWx.uploadFile = wx.uploadFile;
        wx.uploadFile = function(options) {
          // 检查是否在开发模式
          let isDevMode = true;
          try {
            const request = require('./request');
            isDevMode = request.isDevMode();
          } catch (e) {
            console.warn('无法加载request模块，默认使用开发模式', e);
          }
          
          if (isDevMode) {
            console.log(`Mock uploadFile called with:`, options);
            
            // 模拟上传成功
            setTimeout(() => {
              if (options.success) {
                options.success({
                  statusCode: 200,
                  data: JSON.stringify({
                    code: 0,
                    message: 'success',
                    data: {
                      url: options.filePath,
                      fileId: 'mock_file_' + Date.now()
                    }
                  }),
                  errMsg: 'uploadFile:ok'
                });
              }
              
              if (options.complete) {
                options.complete({
                  errMsg: 'uploadFile:ok'
                });
              }
            }, 500);
            
            // 返回一个模拟的上传任务
            return {
              abort: () => console.log('Upload aborted'),
              onProgressUpdate: (callback) => {
                setTimeout(() => callback({ progress: 100 }), 400);
              },
              offProgressUpdate: () => {}
            };
          } else {
            // 非开发模式，使用原始方法
            return originalWx.uploadFile(options);
          }
        };
      }
      
      // 覆盖下载文件API
      if (wx.downloadFile) {
        originalWx.downloadFile = wx.downloadFile;
        wx.downloadFile = function(options) {
          // 检查是否在开发模式
          let isDevMode = true;
          try {
            const request = require('./request');
            isDevMode = request.isDevMode();
          } catch (e) {
            console.warn('无法加载request模块，默认使用开发模式', e);
          }
          
          if (isDevMode) {
            console.log(`Mock downloadFile called with:`, options);
            
            // 模拟下载成功
            setTimeout(() => {
              if (options.success) {
                options.success({
                  statusCode: 200,
                  tempFilePath: '/mock_temp_path/file_' + Date.now(),
                  filePath: '/mock_path/file_' + Date.now(),
                  errMsg: 'downloadFile:ok'
                });
              }
              
              if (options.complete) {
                options.complete({
                  errMsg: 'downloadFile:ok'
                });
              }
            }, 500);
            
            // 返回一个模拟的下载任务
            return {
              abort: () => console.log('Download aborted'),
              onProgressUpdate: (callback) => {
                setTimeout(() => callback({ progress: 100 }), 400);
              },
              offProgressUpdate: () => {}
            };
          } else {
            // 非开发模式，使用原始方法
            return originalWx.downloadFile(options);
          }
        };
      }
      
      console.log('微信文件API已被覆盖，文件操作将在开发模式下模拟执行');
    } catch (error) {
      console.warn('覆盖微信API失败:', error);
    }
  },

  /**
   * 根据API类型获取模拟结果
   */
  getMockResultForAPI: function(api, options) {
    switch(api) {
      case 'saveFile':
        return {
          savedFilePath: '/mock_saved_path/file_' + Date.now(),
          errMsg: 'saveFile:ok'
        };
      case 'getFileInfo':
        return {
          size: 1024,
          createTime: Date.now(),
          errMsg: 'getFileInfo:ok'
        };
      case 'getSavedFileList':
        return {
          fileList: [
            {
              filePath: '/mock_path/file1',
              createTime: Date.now() - 86400000,
              size: 1024
            },
            {
              filePath: '/mock_path/file2',
              createTime: Date.now(),
              size: 2048
            }
          ],
          errMsg: 'getSavedFileList:ok'
        };
      case 'getSavedFileInfo':
        return {
          size: 1024,
          createTime: Date.now(),
          errMsg: 'getSavedFileInfo:ok'
        };
      case 'openDocument':
        return {
          errMsg: 'openDocument:ok'
        };
      case 'writeFile':
      case 'writeFileSync':
        return {
          errMsg: 'writeFile:ok'
        };
      case 'readFile':
      case 'readFileSync':
        return {
          data: 'mock file content',
          errMsg: 'readFile:ok'
        };
      case 'access':
      case 'accessSync':
        return {
          errMsg: 'access:ok'
        };
      case 'appendFile':
      case 'appendFileSync':
        return {
          errMsg: 'appendFile:ok'
        };
      default:
        return {
          errMsg: `${api}:ok`
        };
    }
  }
};

module.exports = debugUtil; 
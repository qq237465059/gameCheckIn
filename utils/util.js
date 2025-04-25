// 通用工具函数

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {String} fmt 格式化模板，例如：'YYYY-MM-DD hh:mm:ss'
 * @returns {String} 格式化后的时间字符串
 */
const formatTime = (date, fmt = 'YYYY-MM-DD hh:mm:ss') => {
  if (!date) {
    return '';
  }
  
  if (typeof date === 'string') {
    date = new Date(date.replace(/-/g, '/'));
  }
  
  if (typeof date === 'number') {
    date = new Date(date);
  }
  
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'D+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  };
  
  if (/(Y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  
  return fmt;
};

/**
 * 格式化日期范围
 * @param {String|Number|Date} startTime 开始时间
 * @param {String|Number|Date} endTime 结束时间
 * @returns {String} 格式化后的时间范围
 */
const formatDateRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return '';
  }
  
  const start = formatTime(startTime, 'MM月DD日 hh:mm');
  const end = formatTime(endTime, 'MM月DD日 hh:mm');
  
  return `${start} - ${end}`;
};

/**
 * 将日期格式化为相对时间
 * @param {String|Number|Date} dateTime 日期时间
 * @returns {String} 相对时间，例如：刚刚、5分钟前、2小时前、昨天、2天前、1周前等
 */
const formatRelativeTime = (dateTime) => {
  if (!dateTime) {
    return '';
  }
  
  const now = new Date();
  const date = new Date(dateTime);
  const diff = now.getTime() - date.getTime();
  
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < day * 2) {
    return '昨天';
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前';
  } else {
    return formatTime(date, 'MM月DD日');
  }
};

/**
 * 生成UUID
 * @returns {String} UUID字符串
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 截取字符串并添加省略号
 * @param {String} str 原字符串
 * @param {Number} length 截取长度
 * @returns {String} 截取后的字符串
 */
const truncateString = (str, length = 10) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

module.exports = {
  formatTime,
  formatDateRange,
  formatRelativeTime,
  generateUUID,
  truncateString
}; 
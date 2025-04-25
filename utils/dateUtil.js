// 日期工具类
const dateUtil = {
  /**
   * 格式化日期时间
   * @param {Date|String} date 日期对象或日期字符串
   * @param {String} format 格式化模板，默认为'YYYY-MM-DD HH:mm:ss'
   * @returns {String} 格式化后的日期字符串
   */
  formatDateTime: function(date, format = 'YYYY-MM-DD HH:mm') {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    // 补零函数
    const padZero = (num) => {
      return num < 10 ? '0' + num : num;
    };
    
    format = format.replace(/YYYY/g, year);
    format = format.replace(/MM/g, padZero(month));
    format = format.replace(/DD/g, padZero(day));
    format = format.replace(/HH/g, padZero(hours));
    format = format.replace(/mm/g, padZero(minutes));
    format = format.replace(/ss/g, padZero(seconds));
    
    return format;
  },
  
  /**
   * 格式化为相对时间，如"几分钟前"、"几小时前"等
   * @param {Date|String} date 日期对象或日期字符串
   * @returns {String} 相对时间字符串
   */
  formatRelativeTime: function(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    
    if (years > 0) {
      return years + '年前';
    } else if (months > 0) {
      return months + '个月前';
    } else if (days > 0) {
      return days + '天前';
    } else if (hours > 0) {
      return hours + '小时前';
    } else if (minutes > 0) {
      return minutes + '分钟前';
    } else {
      return '刚刚';
    }
  },
  
  /**
   * 格式化日期范围
   * @param {Date|String} startDate 开始日期
   * @param {Date|String} endDate 结束日期
   * @param {String} format 格式化模板
   * @returns {String} 格式化后的日期范围字符串
   */
  formatDateRange: function(startDate, endDate, format = 'MM月DD日 HH:mm') {
    if (!startDate || !endDate) return '';
    
    const startStr = this.formatDateTime(startDate, format);
    const endStr = this.formatDateTime(endDate, format);
    
    return startStr + ' 至 ' + endStr;
  },
  
  /**
   * 获取当前日期的字符串表示
   * @param {String} format 格式化模板
   * @returns {String} 当前日期字符串
   */
  getCurrentDate: function(format = 'YYYY-MM-DD') {
    return this.formatDateTime(new Date(), format);
  },
  
  /**
   * 获取明天的日期
   * @param {String} format 格式化模板
   * @returns {String} 明天的日期字符串
   */
  getTomorrowDate: function(format = 'YYYY-MM-DD') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDateTime(tomorrow, format);
  },
  
  /**
   * 计算两个日期之间的天数差
   * @param {Date|String} date1 日期1
   * @param {Date|String} date2 日期2
   * @returns {Number} 天数差
   */
  getDaysBetween: function(date1, date2) {
    if (typeof date1 === 'string') {
      date1 = new Date(date1);
    }
    
    if (typeof date2 === 'string') {
      date2 = new Date(date2);
    }
    
    // 清除时分秒，只比较日期部分
    date1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    date2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },
  
  /**
   * 判断是否是同一天
   * @param {Date|String} date1 日期1
   * @param {Date|String} date2 日期2
   * @returns {Boolean} 是否是同一天
   */
  isSameDay: function(date1, date2) {
    if (typeof date1 === 'string') {
      date1 = new Date(date1);
    }
    
    if (typeof date2 === 'string') {
      date2 = new Date(date2);
    }
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },
  
  /**
   * 获取日期的星期几
   * @param {Date|String} date 日期
   * @returns {String} 星期几的中文表示
   */
  getWeekDay: function(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekDays[date.getDay()];
  }
};

module.exports = dateUtil; 
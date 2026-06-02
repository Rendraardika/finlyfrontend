const monthMap = {
  'Jan': 0, 'Januari': 0,
  'Feb': 1, 'Februari': 1,
  'Mar': 2, 'Maret': 2,
  'Apr': 3, 'April': 3,
  'Mei': 4,
  'Jun': 5, 'Juni': 5,
  'Jul': 6, 'Juli': 6,
  'Agu': 7, 'Agustus': 7,
  'Sep': 8, 'September': 8,
  'Okt': 9, 'Oktober': 9,
  'Nov': 10, 'November': 10,
  'Des': 11, 'Desember': 11,
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * @param {string} dateStr - Date string in format "DD MMM YYYY"
 * @returns {Date} Date object
 */
export const parseIndonesianDate = (dateStr) => {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) {
    console.warn('Invalid date format:', dateStr);
    return new Date();
  }

  const [day, monthStr, year] = parts;
  const monthIndex = monthMap[monthStr];
  
  if (monthIndex === undefined) {
    console.warn('Unknown month:', monthStr);
    return new Date();
  }

  return new Date(year, monthIndex, day);
};

/**
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string
 */
export const formatToIndonesianDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * @param {string} dateA - First date (24 Okt 2026)
 * @param {string} dateB - Second date (24 Okt 2026)
 * @returns {number} -1 if A < B, 0 if equal, 1 if A > B
 */
export const compareIndonesianDates = (dateA, dateB) => {
  const a = parseIndonesianDate(dateA);
  const b = parseIndonesianDate(dateB);
  
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

/**
 * @returns {string} Today's date (24 Mei 2026)
 */
export const getTodayIndonesianFormat = () => {
  return formatToIndonesianDate(new Date());
};

/**
 * @param {string} dateStr - Indonesian date format
 * @returns {boolean}
 */
export const isToday = (dateStr) => {
  const parsed = parseIndonesianDate(dateStr);
  const today = new Date();
  return (
    parsed.getDate() === today.getDate() &&
    parsed.getMonth() === today.getMonth() &&
    parsed.getFullYear() === today.getFullYear()
  );
};

/**
 * @param {string} dateStr - Indonesian date format
 * @returns {{month: string, year: string}} e.g. {month: 'Okt', year: '2026'}
 */
export const getMonthYearFromIndonesianDate = (dateStr) => {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return { month: '', year: '' };
  return { month: parts[1], year: parts[2] };
};

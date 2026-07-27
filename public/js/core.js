function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* 核心工具与通用组件 */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;

// ---------------- API ----------------
window.API = async function (path, method = 'GET', body) {
  const opt = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const token = localStorage.getItem('pw_token');
  if (token) opt.headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) opt.body = JSON.stringify(body);
  const r = await fetch('/api' + path, opt);
  if (r.status === 401) {
    localStorage.removeItem('pw_token');
    window.dispatchEvent(new Event('pw-unauth'));
    throw new Error('登录已过期');
  }
  if (!r.ok) throw new Error('请求失败 (' + r.status + ')');
  return r.json();
};

// ---------------- Toast ----------------
window.toast = function (msg, type = 'success') {
  window.dispatchEvent(new CustomEvent('pw-toast', {
    detail: {
      msg,
      type,
      id: Date.now() + Math.random()
    }
  }));
};
window.ToastHost = function ToastHost() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const h = e => {
      const t = e.detail;
      setList(l => [...l, t]);
      setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), 2600);
    };
    window.addEventListener('pw-toast', h);
    return () => window.removeEventListener('pw-toast', h);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed top-16 left-1/2 -translate-x-1/2 z-[100] space-y-2 pointer-events-none"
  }, list.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: 'toast-in px-4 py-2.5 rounded-xl shadow-lift text-white text-sm font-medium flex items-center gap-2 ' + (t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-primary' : 'bg-emerald-500')
  }, /*#__PURE__*/React.createElement("span", null, t.type === 'error' ? '✕' : t.type === 'info' ? 'ⓘ' : '✓'), t.msg)));
};

// ---------------- Modal ----------------
window.Modal = function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-4",
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose();
    },
    style: {
      background: 'rgba(40,50,60,0.45)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: 'fade-in bg-white rounded-2xl shadow-lift w-full flex flex-col max-h-[88vh] ' + (wide ? 'max-w-3xl' : 'max-w-lg')
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-6 py-4 border-b border-gray-100"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800"
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 text-lg"
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 overflow-y-auto"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 border-t border-gray-100 flex justify-end gap-3"
  }, footer)));
};

// ---------------- 确认对话框 ----------------
window.Confirm = function Confirm({
  open,
  text,
  onOk,
  onClose
}) {
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    title: "\u8BF7\u786E\u8BA4",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(BtnGhost, {
      onClick: onClose
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
      onClick: onOk,
      className: "px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600"
    }, "\u786E\u8BA4\u5220\u9664"))
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600 text-sm"
  }, text || '确定要删除这条数据吗？此操作不可恢复。'));
};

// ---------------- 基础控件 ----------------
window.Btn = ({
  children,
  onClick,
  className = '',
  disabled
}) => /*#__PURE__*/React.createElement("button", {
  disabled: disabled,
  onClick: onClick,
  className: 'px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primarydark transition disabled:opacity-50 ' + className
}, children);
window.BtnAccent = ({
  children,
  onClick,
  className = ''
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: 'px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition ' + className
}, children);
window.BtnGhost = ({
  children,
  onClick,
  className = ''
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: 'px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition ' + className
}, children);
window.Input = props => /*#__PURE__*/React.createElement("input", _extends({}, props, {
  className: 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')
}));
window.Select = ({
  children,
  ...props
}) => /*#__PURE__*/React.createElement("select", _extends({}, props, {
  className: 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')
}), children);
window.TextArea = props => /*#__PURE__*/React.createElement("textarea", _extends({}, props, {
  className: 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition ' + (props.className || '')
}));
window.Field = ({
  label,
  children,
  required
}) => /*#__PURE__*/React.createElement("div", {
  className: "mb-3"
}, /*#__PURE__*/React.createElement("label", {
  className: "block text-xs font-medium text-gray-500 mb-1"
}, label, required && /*#__PURE__*/React.createElement("span", {
  className: "text-red-400 ml-0.5"
}, "*")), children);
window.Card = ({
  children,
  className = ''
}) => /*#__PURE__*/React.createElement("div", {
  className: 'bg-white rounded-2xl shadow-soft p-5 ' + className
}, children);
window.EmptyState = ({
  text = '还没有记录，点击上方按钮添加第一条'
}) => /*#__PURE__*/React.createElement("div", {
  className: "py-12 text-center text-gray-400 text-sm"
}, /*#__PURE__*/React.createElement("div", {
  className: "text-4xl mb-3"
}, "\uD83C\uDF31"), text);
window.Tag = ({
  children,
  color = 'gray'
}) => {
  const map = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-amber-100 text-amber-700',
    primary: 'bg-primary/10 text-primary'
  };
  return /*#__PURE__*/React.createElement("span", {
    className: 'inline-block px-2 py-0.5 rounded-full text-xs font-medium ' + (map[color] || map.gray)
  }, children);
};

// ---------------- 日期工具 ----------------
window.fmtDate = d => {
  const x = d instanceof Date ? d : new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
window.today = () => fmtDate(new Date());
window.fmtMin = m => {
  m = Number(m) || 0;
  if (m < 60) return m + ' 分钟';
  const h = Math.floor(m / 60),
    r = m % 60;
  return r ? h + ' 小时 ' + r + ' 分' : h + ' 小时';
};
window.weekRange = (d = new Date()) => {
  const day = (d.getDay() + 6) % 7; // 周一为一周开始
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [fmtDate(start), fmtDate(end)];
};
window.monthRange = (d = new Date()) => {
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [fmtDate(s), fmtDate(e)];
};
window.yearRange = (d = new Date()) => [d.getFullYear() + '-01-01', d.getFullYear() + '-12-31'];

// ---------------- 常量 ----------------
window.PRIORITY_COLOR = {
  '高': 'red',
  '中': 'yellow',
  '低': 'gray'
};
window.TOPIC_STATUS_COLOR = {
  '选题中': 'gray',
  '撰写中': 'blue',
  '拍摄中': 'purple',
  '剪辑中': 'orange',
  '已发布': 'green'
};
window.TOPIC_TYPES = ['图文', '对谈长视频', '口播短视频'];
window.IDEA_TAGS = ['心理学理论', '热点话题', '生活观察', '读者提问', '其他'];
window.IDEA_STATUS = ['待孵化', '已采用', '已归档'];
window.LEARN_TYPES = ['督导', '培训', '个人体验', '阅读'];

// ---------------- 图表组件 ----------------
window.BarChart = function BarChart({
  labels,
  datasets,
  height = 220,
  stacked = false
}) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          }
        },
        scales: {
          x: {
            stacked,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            stacked,
            beginAtZero: true,
            grid: {
              color: '#f0ece6'
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref
  }));
};
window.LineChart = function LineChart({
  labels,
  datasets,
  height = 220
}) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(d => Object.assign({
          tension: 0.35,
          pointRadius: 2.5,
          borderWidth: 2
        }, d))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: {
                size: 11
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f0ece6'
            },
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [JSON.stringify(labels), JSON.stringify(datasets)]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref
  }));
};
const isElectron = window.api !== undefined;

const getAppHeight = () => {
  if (typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
    return `${window.innerHeight}px`;
  }
  return isElectron ? 'calc(100vh - 30px)' : '100vh';
};



export const layoutStyles = {
  appContainer: {
    width: '100vw',
    height: getAppHeight(),
    bg: '#888888', // 灰色背景
    color: 'white',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    mt: isElectron ? '30px' : '0',
    p: '20px', // 添加内边距
  },
  sidebar: {
    position: 'relative' as const,
    width: '0px', // 隐藏侧边栏
    height: '100%',
    bg: 'gray.800',
    borderRight: '1px solid',
    borderColor: 'whiteAlpha.200',
    overflow: 'hidden',
    flexShrink: 0,
    transition: 'all 0.2s',
    display: 'none', // 完全隐藏侧边栏
  },
  mainContent: {
    width: '100%',
    maxWidth: '1200px', // 设置最大宽度
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    bg: 'black', // 黑色主内容区域
    borderRadius: '12px', // 圆角边框
  },
  canvas: {
    position: 'relative',
    width: '100%',
    flex: 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    willChange: 'transform',
  },
  footer: {
    width: '100%',
    height: { base: '100px', md: '120px' },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
    position: 'relative',
    zIndex: 1,
  },
  toggleButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '60px',
    bg: 'whiteAlpha.100',
    _hover: { bg: 'whiteAlpha.200' },
    borderLeftRadius: 0,
    borderRightRadius: 'md',
    zIndex: 10,
  },
  canvasHeight: (isFooterCollapsed: boolean) => ({
    height: isFooterCollapsed ? 'calc(100% - 24px)' : 'calc(100% - 120px)',
  }),
  sidebarToggleButton: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '60px',
    bg: 'gray.800',
    borderLeftRadius: 0,
    borderRightRadius: 'md',
    zIndex: 10,
  },
  collapsedFooter: {
    height: { base: '20px', md: '24px' },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  windowsTitleBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '30px',
    backgroundColor: 'gray.800',
    paddingX: '10px',
    zIndex: 1000,
    css: { '-webkit-app-region': 'drag' },
  },
  macTitleBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '30px',
    backgroundColor: 'gray.800',
    zIndex: 1000,
    css: {
      '-webkit-app-region': 'drag',
      '-webkit-user-select': 'none',
    },
  },
  titleBarTitle: {
    fontSize: 'sm',
    color: 'whiteAlpha.800',
    textAlign: 'center',
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1',
  },
  titleBarButton: {
    size: 'sm',
    variant: 'ghost',
    color: 'whiteAlpha.800',
    css: { '-webkit-app-region': 'no-drag' },
    _hover: { backgroundColor: 'whiteAlpha.200' },
  },
  closeButton: {
    size: 'sm',
    variant: 'ghost',
    color: 'whiteAlpha.800',
    css: { '-webkit-app-region': 'no-drag' },
    _hover: { backgroundColor: 'red.500' },
  },
} as const;

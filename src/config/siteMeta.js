export const SITE = {
  name: 'BuildTrack',
  tagline: 'Construction Cost Intelligence & Project Management',
  description:
    'Track construction costs, manage materials, monitor budgets, and forecast project spend — all in one workspace built for builders and project teams.',
  url: import.meta.env.VITE_SITE_URL || 'https://buildtrack-frontend.vercel.app',
  ogImage: '/og-image.png',
  themeColor: '#26251e',
  locale: 'en_US',
};

export const PAGE_META = {
  login: {
    title: 'Sign In',
    description:
      'Sign in to BuildTrack to manage construction projects, track daily costs, and stay ahead of budget overruns.',
  },
  dashboard: {
    title: 'Dashboard',
    description:
      'View all your construction projects, monitor spend, and jump into project workspaces from one dashboard.',
    noIndex: true,
  },
  admin: {
    title: 'Admin Console',
    description:
      'Manage users, roles, and company settings across your BuildTrack organization.',
    noIndex: true,
  },
};

const PROJECT_SECTIONS = {
  overview: {
    title: 'Overview',
    description: (project) =>
      `Executive overview and cost tracking analytics for ${project}.`,
  },
  planning: {
    title: 'Project Planning',
    description: (project) => `Plan phases, milestones, and timelines for ${project}.`,
  },
  budget: {
    title: 'Budget Planning',
    description: (project) => `Set and manage the budget for ${project}.`,
  },
  'daily-tracking': {
    title: 'Daily Tracking',
    description: (project) => `Log daily site activity, labor, and costs for ${project}.`,
  },
  materials: {
    title: 'Materials Center',
    description: (project) => `Browse and manage materials used on ${project}.`,
  },
  'material-detail': {
    title: 'Material Detail',
    description: (project) => `View material usage, costs, and history on ${project}.`,
  },
  'planned-vs-actual': {
    title: 'Planned vs Actual',
    description: (project) => `Compare planned and actual spend for ${project}.`,
  },
  inventory: {
    title: 'Inventory',
    description: (project) => `Track on-site inventory and stock levels for ${project}.`,
  },
  forecast: {
    title: 'Forecast & Alerts',
    description: (project) => `Review cost forecasts and risk alerts for ${project}.`,
  },
  procurement: {
    title: 'Procurement',
    description: (project) => `Manage purchase orders and vendor workflows for ${project}.`,
  },
  reports: {
    title: 'Reports',
    description: (project) => `Generate cost and progress reports for ${project}.`,
  },
  team: {
    title: 'Team & Roles',
    description: (project) => `Manage team members and permissions on ${project}.`,
  },
  settings: {
    title: 'Settings',
    description: (project) => `Configure project settings for ${project}.`,
  },
};

export function formatPageTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
}

export function absoluteUrl(path = '/') {
  const base = SITE.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function getProjectPageMeta(projectName, sectionKey, pathname = '') {
  const normalizedKey =
    sectionKey === 'materials' && /\/materials\/[^/]+/.test(pathname)
      ? 'material-detail'
      : sectionKey;
  const section = PROJECT_SECTIONS[normalizedKey] || PROJECT_SECTIONS.overview;
  return {
    title: `${projectName} — ${section.title}`,
    description: section.description(projectName),
    noIndex: true,
  };
}

export function getMetaForPath(pathname) {
  if (pathname === '/login') {
    return { ...PAGE_META.login, path: pathname };
  }
  if (pathname === '/') {
    return { ...PAGE_META.dashboard, path: pathname };
  }
  if (pathname === '/admin') {
    return { ...PAGE_META.admin, path: pathname };
  }
  return null;
}

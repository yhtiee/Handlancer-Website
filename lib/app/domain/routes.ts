/**
 * Web counterpart of mobile src/lib/routes.ts. Same keys, so ported code
 * (job-state.ts) and screens call the same names; the paths are flat URLs under
 * /app.
 *
 * Mobile splits clients and providers into two route groups because a native
 * stack needs separate trees. On the web one URL per thing is simpler to share
 * and harder to get lost in: /app/jobs/[id] shows the owner's view, the hired
 * provider's view or the bidding view depending on who is looking — so the
 * mobile helpers' `shell` argument is gone.
 */

export const routes = {
  home: '/app',
  signIn: '/app/sign-in',
  onboarding: '/app/onboarding',
  /** Artisan application: build the profile, accept the rules, submit for review. */
  apply: '/app/apply',

  // Tab roots — both shells land on /app, which renders the role's home.
  userHome: '/app',
  providerFindWork: '/app',

  // User · Jobs
  myJobs: '/app/jobs',
  postJob: '/app/jobs/new',
  postDirectJob: (providerId: string) => `/app/jobs/new?provider=${providerId}`,
  /** Post a job with the trade already chosen. */
  postJobIn: (category: string) => `/app/jobs/new?category=${category}`,
  jobDetail: (id: string) => `/app/jobs/${id}`,
  jobQuotes: (jobId: string) => `/app/jobs/${jobId}/quotes`,
  reviewJob: (jobId: string) => `/app/jobs/${jobId}/review`,
  disputeJob: (jobId: string) => `/app/jobs/${jobId}/dispute`,

  // User · Discover
  browseProviders: '/app/providers',
  browseProvidersIn: (service: string) => `/app/providers?service=${service}`,
  providerProfile: (id: string) => `/app/providers/${id}`,

  // Provider · Find Work (same job URL; the page picks the bidding view)
  findWork: '/app/find-work',
  findWorkJob: (id: string) => `/app/jobs/${id}`,
  applyToJob: (jobId: string) => `/app/jobs/${jobId}/quote`,

  // Provider · Jobs (hired)
  providerJobDetail: (id: string) => `/app/jobs/${id}`,

  // Provider · Quotes
  providerQuotes: '/app/quotes',
  providerQuote: (id: string) => `/app/quotes/${id}`,

  // Wallet
  wallet: () => '/app/wallet',
  walletFund: () => '/app/wallet/fund',
  walletWithdraw: () => '/app/wallet/withdraw',
  walletBank: () => '/app/wallet/bank',
  walletPin: () => '/app/wallet/pin',
  walletTransaction: (id: string) => `/app/wallet/transactions/${id}`,

  // Chat
  messages: '/app/messages',
  chatThread: (id: string) => `/app/messages/${id}`,

  // Profile
  profile: '/app/profile',
  profileEdit: () => '/app/profile/edit',
  profileNotifications: () => '/app/notifications',
  profileSettings: () => '/app/settings',
  profileSupport: () => '/app/support',
  profileReviews: '/app/profile/reviews',
};

// Mock data for initializing the database
export const mockData = {
  nudges: [
    {
      id: 'high-users-repairs',
      channel: 'APP_INSTANT',
      status: 'ACTIVE',
      type: 'NOTIFICATION',
      shortUrl: '',
      contentTemplate: {
        nudgeCardName: 'Auto Loan for High Users with Repairs',
        title: 'Auto Loan for High Users with Repairs',
        welcomeMessage: '',
        body: 'Targeted promotion for auto repair loans to existing car owners with repair history',
        image: '',
        callToActionLabel: 'Learn More',
        type: 'IMPORTANT'
      },
      metadata: {
        collection: 'car-purchase-loan',
        businessValue: 'High conversion rate for auto repair loan products',
        priority: 'HIGH',
        version: 'Version 5 - Under Review',
        ageRange: { min: 25, max: 55 },
        income: { min: 50000, max: 150000 },
        gender: '-1',
        lastNotification: { days: '30' },
        registration: { registeredOnly: false },
        selectedTags: [
          {
            type: 'Must Have',
            conditions: [{
              tags: ['Car Owner', 'Car Repairs'],
              operator: 'AND'
            }]
          }
        ],
        comment: 'Initial version targeting car owners with repair history'
      }
    },
    {
      id: 'personal-finance-tips',
      channel: 'EMAIL',
      status: 'ACTIVE',
      type: 'NOTIFICATION',
      shortUrl: '',
      contentTemplate: {
        nudgeCardName: 'Personal Finance Management Tips',
        title: 'Personal Finance Management Tips',
        welcomeMessage: 'Hello!',
        body: 'Discover smart ways to manage your personal finances with our expert tips.',
        image: '',
        callToActionLabel: 'View Tips',
        type: 'ADVICE'
      },
      metadata: {
        collection: 'personal-finance',
        businessValue: 'Increase engagement with financial advisory content',
        priority: 'NORMAL',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Regular financial tips for all users'
      }
    },
    {
      id: 'nudge-1',
      title: 'Car Loan Application Follow-up',
      description: 'Follow up on incomplete car loan applications',
      channel: 'email',
      status: 'active',
      type: 'reminder',
      priority: 'high',
      contentTemplate: 'Complete your car loan application today!',
      metadata: {
        collection: 'car-purchase-loan',
        businessValue: 'Increase loan application completion rate',
        priority: 'HIGH',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Follow up on incomplete car loan applications'
      }
    },
    {
      id: 'nudge-2',
      title: 'Car Loan Payment Due',
      description: 'Reminder for upcoming car loan payment',
      channel: 'sms',
      status: 'active',
      type: 'reminder',
      priority: 'medium',
      contentTemplate: 'Your car loan payment is due in 3 days.',
      metadata: {
        collection: 'car-purchase-loan',
        businessValue: 'Reduce loan payment defaults',
        priority: 'MEDIUM',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Reminder for upcoming car loan payment'
      }
    },
    {
      id: 'nudge-3',
      title: 'Personal Finance Tips',
      description: 'Weekly financial management tips',
      channel: 'email',
      status: 'active',
      type: 'educational',
      priority: 'low',
      contentTemplate: 'Here are your weekly personal finance tips!',
      metadata: {
        collection: 'personal-finance',
        businessValue: 'Increase engagement with financial advisory content',
        priority: 'LOW',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Weekly financial management tips'
      }
    },
    {
      id: 'nudge-4',
      title: 'Budget Review',
      description: 'Monthly budget review reminder',
      channel: 'email',
      status: 'active',
      type: 'reminder',
      priority: 'medium',
      contentTemplate: "It's time for your monthly budget review.",
      metadata: {
        collection: 'personal-finance',
        businessValue: 'Increase budget review completion rate',
        priority: 'MEDIUM',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Monthly budget review reminder'
      }
    },
    {
      id: 'nudge-5',
      title: 'Loan Application Status',
      description: 'Update on loan application status',
      channel: 'sms',
      status: 'active',
      type: 'notification',
      priority: 'high',
      contentTemplate: 'Your loan application status has been updated.',
      metadata: {
        collection: 'loans',
        businessValue: 'Increase loan application status awareness',
        priority: 'HIGH',
        version: '1 - Draft',
        ageRange: { min: 18, max: 65 },
        income: { min: 0, max: 0 },
        gender: '-1',
        lastNotification: { days: '7' },
        registration: { registeredOnly: true },
        selectedTags: [],
        comment: 'Update on loan application status'
      }
    }
  ],
  collections: [
    {
      id: 'car-purchase-loan',
      name: 'Car Purchase Loan',
      items: ['high-users-repairs', 'nudge-1', 'nudge-2']
    },
    {
      id: 'personal-finance',
      name: 'Personal Finance Management',
      items: ['personal-finance-tips', 'nudge-3', 'nudge-4']
    },
    {
      id: 'loans',
      name: 'Loans',
      items: ['nudge-5']
    }
  ],
  mediaFolders: [
    {
      id: 'folder-1',
      name: 'Images',
      type: 'images',
      itemCount: 0,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'folder-2',
      name: 'HTML Templates',
      type: 'html',
      itemCount: 0,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'folder-3',
      name: 'Documents',
      type: 'documents',
      itemCount: 0,
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  media: [
    {
      id: 'auto-loan-banner',
      name: 'Auto Loan Banner',
      description: 'Banner image for auto loan campaign',
      type: 'image/jpeg',
      url: 'https://example.com/images/auto-loan-banner.jpg',
      folderId: 'campaign-assets',
      size: 245678,
      dimensions: { width: 1200, height: 628 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'default-notification',
      name: 'Default Notification Icon',
      description: 'Default icon for notifications',
      type: 'image/png',
      url: 'https://example.com/images/notification-icon.png',
      folderId: 'default',
      size: 12345,
      dimensions: { width: 256, height: 256 },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'promo-video',
      name: 'Product Promotional Video',
      description: 'Video showcasing financial products',
      type: 'video/mp4',
      url: 'https://example.com/videos/promo.mp4',
      folderId: 'campaign-assets',
      size: 15678901,
      dimensions: { width: 1920, height: 1080 },
      duration: 120,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  folders: [
    {
      id: 'default',
      name: 'Default',
      description: 'Default media folder',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'campaign-assets',
      name: 'Campaign Assets',
      description: 'Media assets for campaigns',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['Admin'],
      disabled: false,
      disabledDate: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      roles: ['User'],
      disabled: false,
      disabledDate: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ]
};

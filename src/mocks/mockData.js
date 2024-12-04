// Mock data for initializing the database
export const mockData = {
  nudges: [
    {
      id: 'high-users-repairs',
      title: 'Auto Loan for High Users with Repairs',
      collection: 'car-purchase-loan',
      businessValue: 'High conversion rate for auto repair loan products',
      priority: 'high',
      description: 'Targeted promotion for auto repair loans to existing car owners with repair history',
      version: 'Version 5 - Under Review',
      notificationTitle: 'Special Auto Loan Offer',
      notificationBody: 'Get a great rate on your auto repair loan',
      image: '',
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
  ],
  collections: [
    {
      id: 'car-purchase-loan',
      name: 'Car Purchase Loan',
      items: ['high-users-repairs']
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

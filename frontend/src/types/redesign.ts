export type CampaignCategory = 'zakat' | 'wakaf' | 'sedekah' | 'donasi';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: CampaignCategory;
  recipientId?: string; // Link to verified recipient
  targetAmount: number;
  raisedAmount: number;
  distributedAmount: number;
  status: 'active' | 'closed';
  thumbnail: string;
  slug?: string;
  createdAt: any;
}

export interface RecipientNeed {
  item: string;
  target: number;
  current: number;
  unit: string;
}

export interface Recipient {
  id: string;
  name: string;
  bio: string;
  location: string;
  avatar?: string;
  isVerified: boolean;
  verifiedAt?: any;
  verifiedBy?: string;
  needs: RecipientNeed[];
  campaignCount: number;
  createdAt: any;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  campaignId: string;
  amount: number;
  type: CampaignCategory;
  message?: string;
  timestamp: any;
  isAnonymous: boolean;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'success' | 'failed';
}

export interface Distribution {
  id: string;
  campaignId: string;
  amount: number;
  recipientName: string;
  description: string;
  proofImage?: string;
  timestamp: any;
}

export type NotificationType = 'reminder' | 'new_campaign' | 'system' | 'donation_success';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: any;
  link?: string;
}

export interface NotificationSettings {
  remindersEnabled: boolean;
  reminderFrequency: 'weekly' | 'monthly';
  newCampaignsEnabled: boolean;
  donationSuccessEnabled: boolean;
  nextZakatMaalReminder?: any; // Firestore timestamp
}

export interface AppUser {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'donor' | 'admin';
  createdAt: any;
  notificationSettings?: NotificationSettings;
}

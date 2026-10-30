export type SupportTicketCategory =
  | 'TECHNICAL_ISSUE'
  | 'ACCOUNT_ISSUE'
  | 'PAYMENT_ISSUE'
  | 'FEATURE_FEEDBACK'
  | 'OTHER';

export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  userId: string;
  userUsername?: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  attachments?: string[];
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  adminReply?: string;
  responderId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PageSupportTicket {
  content: SupportTicket[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreateSupportTicketPayload {
  category: SupportTicketCategory;
  subject: string;
  description: string;
  attachments?: string[];
  priority?: SupportTicketPriority;
}

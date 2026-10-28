import { apiClient } from '@/lib/api';
import type {
  CreateSupportTicketPayload,
  PageSupportTicket,
  SupportTicket,
} from '@/types/support.type';

export const supportService = {
  /**
   * Tạo yêu cầu hỗ trợ mới
   */
  async createTicket(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    const res = await apiClient.post<SupportTicket>('/api/support/tickets', payload);
    return res.data;
  },

  /**
   * Xem danh sách ticket của tôi
   */
  async getMyTickets(page = 0, size = 10): Promise<PageSupportTicket> {
    const res = await apiClient.get<PageSupportTicket>('/api/support/tickets/me', {
      params: { page, size },
    });
    return res.data;
  },

  /**
   * Xem chi tiết ticket
   */
  async getMyTicketDetail(id: string): Promise<SupportTicket> {
    const res = await apiClient.get<SupportTicket>(`/api/support/tickets/${encodeURIComponent(id)}`);
    return res.data;
  },
};

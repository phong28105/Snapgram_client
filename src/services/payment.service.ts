import { apiClient } from "@/lib/api"
import { BLUE_TICK_PRODUCT } from "@/lib/verified"
import type {
  CreatePaymentResponse,
  PagePaymentResponse,
  PaymentOrderResponse,
} from "@/types/payment.type"

export const paymentService = {
  /** POST /api/payments/momo/create — tạo đơn MoMo, trả paymentUrl để redirect */
  async createMomo(
    productCode: string = BLUE_TICK_PRODUCT.productCode
  ): Promise<CreatePaymentResponse> {
    const res = await apiClient.post<CreatePaymentResponse>("/api/payments/momo/create", {
      productCode,
    })
    return res.data
  },

  /** POST /api/payments/vnpay/create — tạo đơn VNPay, trả paymentUrl để redirect */
  async createVnpay(
    productCode: string = BLUE_TICK_PRODUCT.productCode
  ): Promise<CreatePaymentResponse> {
    const res = await apiClient.post<CreatePaymentResponse>("/api/payments/vnpay/create", {
      productCode,
    })
    return res.data
  },

  /** GET /api/payments/{orderId} — trạng thái thật của đơn (dùng để poll sau khi provider redirect) */
  async getOrder(orderId: string): Promise<PaymentOrderResponse> {
    const res = await apiClient.get<PaymentOrderResponse>(
      `/api/payments/${encodeURIComponent(orderId)}`
    )
    return res.data
  },

  /** GET /api/payments/me?page=0&size=20 — lịch sử đơn của tôi */
  async listMyOrders(page = 0, size = 20): Promise<PagePaymentResponse> {
    const res = await apiClient.get<PagePaymentResponse>("/api/payments/me", {
      params: { page, size },
    })
    return res.data
  },
}

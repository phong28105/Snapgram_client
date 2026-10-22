export type PaymentProvider = "MOMO" | "VNPAY"

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED"

export interface CreatePaymentResponse {
  orderId: string
  paymentUrl: string
  status: PaymentStatus
  expiresAt: string
}

export interface PaymentOrderResponse {
  id: string
  orderId: string
  productCode: string
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
  expiresAt: string
}

export interface PagePaymentResponse {
  content: PaymentOrderResponse[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

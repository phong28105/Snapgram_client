import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email.")
    .email("Email không hợp lệ."),
  displayName: z
    .string()
    .min(2, "Tên hiển thị tối thiểu 2 ký tự.")
    .max(50, "Tên hiển thị tối đa 50 ký tự."),
  username: z
    .string()
    .min(3, "Username tối thiểu 3 ký tự.")
    .max(30, "Username tối đa 30 ký tự.")
    .regex(/^[a-zA-Z0-9._]+$/, "Username chỉ gồm chữ, số, dấu . và _"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự."),
})

export const twoFaSchema = z.object({
  code: z
    .string()
    .min(6, "Mã xác thực tối thiểu 6 ký tự.")
    .max(20, "Mã xác thực không hợp lệ."),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type TwoFaInput = z.infer<typeof twoFaSchema>

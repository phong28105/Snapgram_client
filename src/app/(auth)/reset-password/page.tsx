import AuthLayout from "../_components/auth-layout"
import ResetPasswordForm from "../_components/reset-password-form"

export const metadata = { title: "Đặt lại mật khẩu · Snapgram" }

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  )
}

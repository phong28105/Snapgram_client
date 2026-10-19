import AuthLayout from "../_components/auth-layout"
import ForgotPasswordForm from "../_components/forgot-password-form"

export const metadata = { title: "Quên mật khẩu · Snapgram" }

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  )
}

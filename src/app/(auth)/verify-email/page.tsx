import AuthLayout from "../_components/auth-layout"
import VerifyEmailView from "../_components/verify-email-view"

export const metadata = { title: "Xác thực Email · Snapgram" }

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <VerifyEmailView />
    </AuthLayout>
  )
}

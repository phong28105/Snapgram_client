import AuthLayout from "../_components/auth-layout"
import LoginForm from "../_components/login-form"

export const metadata = { title: "Đăng nhập · Snapgram" }

export default function LoginPage() {
  return <AuthLayout><LoginForm /></AuthLayout>
}
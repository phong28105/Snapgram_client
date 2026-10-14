import AuthLayout from "../_components/auth-layout"
import RegisterForm from "../_components/register-form"

export const metadata = { title: "Đăng ký · Snapgram" }

export default function RegisterPage() {
  return <AuthLayout><RegisterForm /></AuthLayout>
}
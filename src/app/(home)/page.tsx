import Main from "./_components/main"
import Navbar from "./_components/navbar"
import Navbot from "./_components/navbot"
import Sidebar from "./_components/sidebar"
import Sideright from "./_components/sideright"

const Page = () => {
  return (
    <main className="min-h-screen flex">
      <Sidebar />
      <div className="max-md:w-full md:max-w-7xl mx-auto flex flex-col md:flex-row">
        <Navbar />
        <Main />
        <Sideright />
        <Navbot />
      </div>
    </main>
  )
}

export default Page
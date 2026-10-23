import { Sidebar } from "./Sidebar"

export default function Layout({ children }: any) {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 p-6 bg-cmsa-niebla overflow-auto">
        {children}
      </main>
    </div>
  )
}
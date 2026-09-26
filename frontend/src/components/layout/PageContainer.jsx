import Sidebar from './Sidebar'

export default function PageContainer({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  )
}

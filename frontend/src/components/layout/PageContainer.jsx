import TopNavbar from './TopNavbar'

export default function PageContainer({ children }) {
  return (
    <div className="app-shell">
      <TopNavbar />
      <main className="app-main">{children}</main>
    </div>
  )
}

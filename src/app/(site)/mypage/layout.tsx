import MypageShell from './components/MypageShell'

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MypageShell>{children}</MypageShell>
}

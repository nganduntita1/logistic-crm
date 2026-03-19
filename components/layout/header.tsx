interface HeaderProps {
  title?: string
  userName?: string
  userRole?: string
}

export function Header({ title, userName, userRole }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div>
        {title && <h2 className="text-2xl font-semibold">{title}</h2>}
      </div>
      <div className="flex items-center gap-4">
        {userName && (
          <div className="text-sm">
            <p className="font-medium">{userName}</p>
            {userRole && (
              <p className="text-gray-500 capitalize">{userRole}</p>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

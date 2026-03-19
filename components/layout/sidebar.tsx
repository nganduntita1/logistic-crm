"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  UserCircle,
  Car,
  Map,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

type UserRole = "admin" | "operator" | "driver"

interface SidebarProps {
  userRole: UserRole
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "operator"],
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
    roles: ["admin", "operator"],
  },
  {
    href: "/shipments",
    label: "Shipments",
    icon: Package,
    roles: ["admin", "operator"],
  },
  {
    href: "/trips",
    label: "Trips",
    icon: Truck,
    roles: ["admin", "operator"],
  },
  {
    href: "/drivers",
    label: "Drivers",
    icon: UserCircle,
    roles: ["admin"],
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    icon: Car,
    roles: ["admin"],
  },
  {
    href: "/map",
    label: "Map",
    icon: Map,
    roles: ["admin", "operator"],
  },
  {
    href: "/driver-portal",
    label: "Driver Portal",
    icon: Truck,
    roles: ["driver"],
  },
]

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 text-white">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Logistics CRM</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}

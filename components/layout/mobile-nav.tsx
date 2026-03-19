"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  UserCircle,
  Car,
  Map,
} from "lucide-react"

type UserRole = "admin" | "operator" | "driver"

interface MobileNavProps {
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

export function MobileNav({ userRole }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 bg-white shadow-md"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-gray-900 text-white border-gray-800">
          <SheetHeader>
            <SheetTitle className="text-white text-left">
              Logistics CRM
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-2 mt-6">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
          <div className="absolute bottom-4 left-4 right-4">
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
        </SheetContent>
      </Sheet>
    </div>
  )
}

import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  ClipboardList,
  BarChart2,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Users,
  FileCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  
  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: <Home className="mr-3 h-5 w-5" /> },
        { href: "/admin/candidates", label: "Candidates", icon: <Users className="mr-3 h-5 w-5" /> },
        { href: "/admin/assessments", label: "Assessments", icon: <ClipboardList className="mr-3 h-5 w-5" /> },
      ]
    : [
        { href: "/", label: "Overview", icon: <Home className="mr-3 h-5 w-5" /> },
        { href: "/assessments", label: "Assessments", icon: <ClipboardList className="mr-3 h-5 w-5" /> },
        { href: "/progress", label: "Progress", icon: <BarChart2 className="mr-3 h-5 w-5" /> },
        { href: "/feedback", label: "Feedback", icon: <MessageSquare className="mr-3 h-5 w-5" /> },
      ];

  const accountItems = [
    { href: "/profile", label: "Profile", icon: <User className="mr-3 h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-white shadow-md fixed h-full z-30 transition-transform duration-300 transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="p-5">
          <img 
            src="/assets/brand-logo.svg" 
            alt="Switchbee Solutions LLP Logo" 
            className="h-10" 
          />
        </div>
        <nav className="mt-6">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Dashboard
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center px-6 py-3 text-gray-700",
                location === item.href
                  ? "bg-gray-100 border-l-4 border-primary"
                  : "hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="px-4 py-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Account
          </div>
          {accountItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center px-6 py-3 text-gray-700",
                location === item.href
                  ? "bg-gray-100 border-l-4 border-primary"
                  : "hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <a
            href="#"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
              setMobileOpen(false);
            }}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </a>
        </nav>
      </aside>
    </>
  );
}

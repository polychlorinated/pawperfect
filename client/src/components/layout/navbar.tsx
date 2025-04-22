import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MenuIcon, 
  LogOut, 
  User, 
  UserCircle, 
  BookOpen, 
  ChevronDown 
} from "lucide-react";
import PawIcon from "@/components/ui/paw-icon";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification/notification-bell";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAdmin, logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  // Common navigation links for all users
  const commonLinks = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
  ];

  // Links for authenticated users
  const authLinks = [
    { path: "/booking", label: "Book Now" },
  ];

  // Links for admin users
  const adminLinks = [
    { path: "/admin", label: "Admin" },
  ];

  // Documentation links for admin users only
  const docLinks = [
    { path: "/mcp", label: "MCP" },
    { path: "/model-context-protocol", label: "Model Context Protocol" },
    { path: "/api-docs", label: "API Docs" },
    { path: "/admin/webhooks", label: "Webhooks" },
  ];

  // Determine which links to show based on user status
  const navLinks = [
    ...commonLinks,
    ...(user ? authLinks : []),
    ...(isAdmin ? adminLinks : []),
    // We don't add docLinks here as they'll be in a dropdown
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <PawIcon className="h-8 w-auto text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">PawPerfect</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path}
                  className={`${
                    isActive(link.path) 
                      ? 'border-primary text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Documentation dropdown menu (desktop) */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className={`${
                        docLinks.some(link => isActive(link.path))
                          ? 'border-primary text-gray-900' 
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-1`}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Documentation</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {docLinks.map((link) => (
                      <DropdownMenuItem key={link.path} asChild>
                        <Link href={link.path} className="cursor-pointer">
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* User menu / Login button */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span>{user.username}</span>
                    {isAdmin && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth">Login / Register</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center ml-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-6 flow-root">
                  <div className="py-4">
                    <div className="space-y-1 px-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.path}
                          href={link.path}
                          className={`${
                            isActive(link.path)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } block rounded-md py-2 px-3 text-base font-medium`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                      
                      {/* Documentation section in mobile menu */}
                      {isAdmin && (
                        <>
                          <div className="pt-4 pb-2">
                            <div className="border-t border-gray-200" />
                          </div>
                          <div className="text-gray-600 font-medium px-3 pt-2 pb-1 text-sm flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            Documentation
                          </div>
                          {docLinks.map((link) => (
                            <Link
                              key={link.path}
                              href={link.path}
                              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block rounded-md py-2 px-6 text-sm font-medium"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </>
                      )}
                      
                      {user && (
                        <>
                          <div className="pt-4 pb-2">
                            <div className="border-t border-gray-200" />
                          </div>
                          <Link
                            href="/profile"
                            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block rounded-md py-2 px-3 text-base font-medium"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 block rounded-md py-2 px-3 text-base font-medium w-full text-left"
                          >
                            Log out
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

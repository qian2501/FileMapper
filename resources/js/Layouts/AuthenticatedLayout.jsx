import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/Logos/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import Button from '@/Components/Button';

export default function AuthenticatedLayout({ children }) {
  const { auth } = usePage().props;

  var routes = [
    'index',
  ];

  var routesDisplay = [
    'Rules',
  ];

  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-gray-800 text-gray-100 flex">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden sm:flex flex flex-col p-4 border-r border-gray-800 bg-gray-700">
        {/* Sidebar Header */}
        <div className="py-6">
          <ApplicationLogo className="h-8 m-auto" />
        </div>

        {/* Sidebar Content */}
        <div className="flex flex-col h-full py-6 border-t border-gray-800">
          {routes.map((one, index) => (
            <Link
              key={index}
              href={route(one)}
              className="block w-full py-2"
            >
              <Button className={`w-full ${route().current(one) && 'border-b-2 border-indigo-400'}`}>{routesDisplay[index]}</Button>
            </Link>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <Dropdown>
            <Dropdown.Trigger>
              <div className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-800">
                <div className="text-left">
                  <div className="text-gray-100 font-medium">{auth.user.name}</div>
                </div>
              </div>
            </Dropdown.Trigger>

            <Dropdown.Content direction="up">
              <Dropdown.Link href={route('logout')} method="post" as="button">
                登出
              </Dropdown.Link>
            </Dropdown.Content>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Nav Toggle */}
      <div className="sm:hidden fixed top-2 left-2 z-50">
        <button
          onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-100 hover:text-gray-300 focus:outline-none transition duration-150 ease-in-out"
        >
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path
              className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path
              className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden fixed inset-0 z-40 bg-black bg-opacity-90'}>
        <div className="h-full w-full flex flex-col mt-16">
          <div className="w-full">
            {routes.map((one, index) =>
              <ResponsiveNavLink
                key={index}
                href={route(one)}
                active={route().current(one)}
                className="block px-6 py-4 text-gray-100 hover:text-gray-300 text-center"
              >
                {routesDisplay[index]}
              </ResponsiveNavLink>
            )}

            <div className="border-t border-gray-700 mt-2">
              <ResponsiveNavLink
                method="post"
                href={route('logout')}
                as="button"
                className="block w-full text-center px-6 py-4 text-gray-100 hover:text-gray-300"
              >
                登出
              </ResponsiveNavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

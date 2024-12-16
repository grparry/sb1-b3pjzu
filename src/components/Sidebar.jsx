import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUserRound, LayoutDashboard, Film, FolderOpen, Headphones, Users, Activity, Megaphone, CreditCard, LogOut, X, Bug, Code } from 'lucide-react';
import PropTypes from 'prop-types';
import useAuth from '../hooks/useAuth';

function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const menuItems = [
    {
      label: 'Campaigns',
      path: '/campaigns',
      icon: Megaphone
    },
    {
      label: 'Cards',
      path: '/cards',
      icon: CreditCard
    },
    {
      label: 'Nudges',
      path: '/nudges',
      icon: LayoutDashboard
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: Activity
    },
    {
      label: 'Media',
      path: '/media',
      icon: Film
    },
    {
      label: 'Media Folders',
      path: '/media-folders',
      icon: FolderOpen
    },
    {
      label: 'Users',
      path: '/users',
      icon: Users
    },
    {
      label: 'Development',
      icon: Bug,
      children: [
        {
          label: 'Debugging',
          path: '/debugging',
          icon: Bug
        },
        {
          label: 'API Testing',
          path: '/api-testing',
          icon: Code
        },
        {
          label: 'Token Test',
          path: '/token-test',
          icon: CircleUserRound
        }
      ]
    }
  ];

  return (
    <div className="w-64 bg-sky-400 min-h-screen text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold">ENGAGEMENT Studios</h1>
        <button onClick={onClose} className="lg:hidden text-white">
          <X size={24} />
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <CircleUserRound size={20} />
          </div>
          <div>
            <div className="font-medium truncate">{user?.email || 'User'}</div>
            <div className="text-sm">ieDigital AI</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-white/80 hover:text-white mt-2 px-2"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <nav className="space-y-6">
        <div>
          <div className="font-medium mb-2">NBA Studio</div>
          <ul className="pl-4 space-y-2">
            {menuItems
              .filter(item => !item.children && 
                item.path !== '/users' && 
                item.path !== '/media' && 
                item.path !== '/media-folders'
              )
              .map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2 rounded ${
                    isActive(item.path) ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Content Studio</div>
          <ul className="pl-4 space-y-2">
            {menuItems.filter(item => item.path === '/media' || item.path === '/media-folders').map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2 rounded ${
                    isActive(item.path) ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Headphones size={18} />
            <span className="truncate">Support</span>
          </div>
        </div>

        <div>
          <div className="font-medium mb-2">Access Studio</div>
          <ul className="pl-4 space-y-2">
            {menuItems.filter(item => item.path === '/users').map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2 rounded ${
                    isActive(item.path) ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Development</div>
          <ul className="pl-4 space-y-2">
            {menuItems.find(item => item.label === 'Development').children.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2 rounded ${
                    isActive(item.path) ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func
};

export default Sidebar;
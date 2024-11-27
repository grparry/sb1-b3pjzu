import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleUserRound, LayoutDashboard, Film, FolderOpen, Headphones, Users, Activity, Megaphone, CreditCard, LogOut, X, Bug } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';

function Sidebar({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

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
            <li>
              <Link
                to="/campaigns"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/campaigns') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Megaphone size={18} />
                <span className="truncate">Campaigns</span>
              </Link>
            </li>
            <li>
              <Link
                to="/cards"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/cards') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <CreditCard size={18} />
                <span className="truncate">Cards</span>
              </Link>
            </li>
            <li>
              <Link
                to="/nudges"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/nudges') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="truncate">Nudges</span>
              </Link>
            </li>
            <li>
              <Link
                to="/analytics"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/analytics') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Activity size={18} />
                <span className="truncate">Analytics</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Content Studio</div>
          <ul className="pl-4 space-y-2">
            <li>
              <Link
                to="/media"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/media') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Film size={18} />
                <span className="truncate">Media</span>
              </Link>
            </li>
            <li>
              <Link
                to="/media-folders"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/media-folders') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <FolderOpen size={18} />
                <span className="truncate">Media Folders</span>
              </Link>
            </li>
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
            <li>
              <Link
                to="/users"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/users') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Users size={18} />
                <span className="truncate">Users</span>
              </Link>
            </li>
            <li>
              <Link
                to="/activities"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/activities') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Activity size={18} />
                <span className="truncate">Activities</span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-medium mb-2">Development</div>
          <ul className="pl-4 space-y-2">
            <li>
              <Link
                to="/debugging"
                onClick={onClose}
                className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isActive('/debugging') ? 'bg-sky-500' : 'hover:bg-sky-500/50'
                }`}
              >
                <Bug size={18} />
                <span className="truncate">Debugging</span>
              </Link>
            </li>
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
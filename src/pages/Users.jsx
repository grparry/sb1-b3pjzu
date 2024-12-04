import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, AlertCircle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { fetchUsers, updateUser } from '../services/api';
import { resetDatabase } from '../services/storage';
import { initializeStores } from '../mocks/initializeStores';
import useConfigStore from '../services/config';

function Users() {
  const { useMockData } = useConfigStore();
  const [filters, setFilters] = useState({
    search: '',
    onlyDisabled: false,
    onlyPrivileged: false,
    page: 1,
    pageSize: 10
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Handle data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize mock data if needed
        if (useMockData) {
          console.log('Initializing mock data for Users component...');
          await initializeStores(false);
        }

        console.log('Loading users with mock data:', useMockData);
        const response = await fetchUsers();
        setUsers(response?.data || []);
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.page, filters.pageSize, useMockData]);

  const handleToggleUserStatus = async (user) => {
    try {
      const updatedUser = await updateUser(user.id, {
        ...user,
        disabled: !user.disabled,
        disabledDate: !user.disabled ? new Date().toISOString() : null
      });
      
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (err) {
      console.error('Error toggling user status:', err);
      // Show error toast/notification here
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      Object.values(user).some(value => 
        typeof value === 'string' && 
        value.toLowerCase().includes(filters.search.toLowerCase())
      );
    
    const matchesDisabled = !filters.onlyDisabled || user.disabled;
    const matchesPrivileged = !filters.onlyPrivileged || user.roles.includes('Admin');

    return matchesSearch && matchesDisabled && matchesPrivileged;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: 'Engagement Studios', path: '/' },
            { label: 'Users' }
          ]}
        />

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-grow">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Filter Search"
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.onlyDisabled}
                  onChange={(e) => setFilters({ ...filters, onlyDisabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Only Disabled</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.onlyPrivileged}
                  onChange={(e) => setFilters({ ...filters, onlyPrivileged: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Only Privileged Users</span>
              </label>
            </div>
          </div>

          <Link
            to="/users/new"
            className="inline-flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 whitespace-nowrap"
          >
            <Plus size={20} />
            Add New User
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="w-10 py-4 px-6">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedUsers.size === filteredUsers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="text-left py-4 px-6 font-medium">First Name</th>
                <th className="text-left py-4 px-6 font-medium">Last Name</th>
                <th className="text-left py-4 px-6 font-medium hidden lg:table-cell">Login</th>
                <th className="text-left py-4 px-6 font-medium hidden lg:table-cell">Email</th>
                <th className="text-left py-4 px-6 font-medium">Roles</th>
                <th className="text-left py-4 px-6 font-medium hidden lg:table-cell">Disabled Date</th>
                <th className="text-left py-4 px-6 font-medium hidden lg:table-cell">Reseller|Enterprise</th>
                <th className="text-left py-4 px-6 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`border-b hover:bg-gray-50 ${user.disabled ? 'bg-gray-50' : ''}`}>
                  <td className="py-4 px-6">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="py-4 px-6">{user.firstName}</td>
                  <td className="py-4 px-6">{user.lastName}</td>
                  <td className="py-4 px-6 hidden lg:table-cell">{user.login}</td>
                  <td className="py-4 px-6 hidden lg:table-cell">{user.email}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden lg:table-cell">
                    {user.disabled && new Date(user.disabledDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 hidden lg:table-cell">{user.enterprise}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/users/edit/${user.id}`}
                        className="p-1 hover:bg-gray-100 rounded text-sky-500 hover:text-sky-600"
                        title="Edit User"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          user.disabled
                            ? 'text-green-500 hover:text-green-600'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        {user.disabled ? 'Enable' : 'Disable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-4 border-t gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select 
              className="border rounded px-2 py-1"
              value={filters.pageSize}
              onChange={(e) => setFilters({ ...filters, pageSize: Number(e.target.value) })}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {filters.page} of {Math.ceil(filteredUsers.length / filters.pageSize)}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(filteredUsers.length / filters.pageSize) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setFilters({ ...filters, page })}
                  className={`px-3 py-1 rounded ${
                    page === filters.page
                      ? 'bg-sky-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Users;
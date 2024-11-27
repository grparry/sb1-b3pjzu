import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

function Users() {
  const [filters, setFilters] = useState({
    search: '',
    onlyDisabled: false,
    onlyPrivileged: true
  });

  const users = [
    {
      id: 'bbbc50b7-ff13-46fa-8408-e7289dced4f8',
      firstName: 'testadmin3',
      lastName: 'abakaresuk-abakatest',
      login: 'testadmin3-abakaresuk-abakatest@yopmail.com',
      email: 'testadmin3-abakaresuk-abakatest@yopmail.com',
      roles: ['Admin'],
      enterprise: 'AbakaResellerUK|AbakaTest',
      disabled: false
    },
    // ... other users
  ];

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="w-10 py-4 px-6">
                  <input type="checkbox" className="rounded border-gray-300" />
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
                    <input type="checkbox" className="rounded border-gray-300" />
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
                    {user.disabled && user.disabledDate}
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
            <select className="border rounded px-2 py-1">
              <option>10</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page 1 of {Math.ceil(filteredUsers.length / 10)}
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-sky-500 text-white rounded">1</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">2</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">3</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">»</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Users;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { logger } from '../services/utils/logging'; // Assuming logger is imported from a separate file

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    enterprise: '',
    firstName: '',
    lastName: '',
    id: '',
    gender: '',
    login: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    roles: [],
    preferredNotificationChannel: 'NONE'
  });

  const roles = [
    'Admin',
    'Support',
    'IFA',
    'IFAManager',
    'Analyst',
    'Developer',
    'Marketing',
    'DocumentManager'
  ];

  useEffect(() => {
    if (id) {
      const fetchUser = async () => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          const mockData = {
            enterprise: 'AbakaTest',
            firstName: 'testadmin3',
            lastName: 'abakaresuk-abakatest',
            id: 'bbbc50b7-ff13-46fa-8408-e7289dced4f8',
            gender: 'Male',
            login: 'testadmin3-abakaresuk-abakatest@yopmail.com',
            email: 'testadmin3-abakaresuk-abakatest@yopmail.com',
            phoneNumber: '+971564912501',
            birthDate: '1990-06-10',
            roles: ['Admin'],
            preferredNotificationChannel: 'NONE'
          };
          setFormData(mockData);
        } catch (error) {
          logger.error('Error fetching user', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/users');
    } catch (error) {
      logger.error('Error saving user', error);
    }
  };

  if (isLoading) {
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
            { label: 'Users', path: '/users' },
            { label: id ? 'Edit User' : 'New User' }
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-semibold">
            {id ? 'Edit User' : 'New User'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enterprise *
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.enterprise}
                onChange={(e) => setFormData({ ...formData, enterprise: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            {id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID
                </label>
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                  value={formData.id}
                  readOnly
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login *
              </label>
              <input
                type="text"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <div className="border rounded-md p-4 space-y-2">
                {roles.map((role) => (
                  <label key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...formData.roles, role]
                          : formData.roles.filter(r => r !== role);
                        setFormData({ ...formData, roles: newRoles });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Notification Channel
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={formData.preferredNotificationChannel}
                onChange={(e) => setFormData({ ...formData, preferredNotificationChannel: e.target.value })}
              >
                <option value="NONE">None</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push Notification</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-sky-600"
            >
              Save User
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default UserForm;
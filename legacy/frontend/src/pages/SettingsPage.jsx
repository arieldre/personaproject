import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../context/authStore';
import { usersAPI } from '../services/api';
import { User, Building2, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await usersAPI.update(user.id, data);
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'company', name: 'Company', icon: Building2 },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-48">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary-700">
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Profile Photo</p>
                    <p className="text-sm text-gray-500">
                      Avatar is synced from your Google/Microsoft account
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First name</label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className={`input ${errors.firstName ? 'input-error' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Last name</label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className={`input ${errors.lastName ? 'input-error' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="label">Role</label>
                  <input
                    type="text"
                    value={user?.role?.replace('_', ' ') || ''}
                    disabled
                    className="input bg-gray-100 capitalize"
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
              {user?.company ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.company.name}</p>
                      <p className="text-sm text-gray-500">/{user.company.slug}</p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Subscription Status</dt>
                      <dd className="mt-1">
                        <span
                          className={`badge ${
                            user.company.subscriptionStatus === 'active'
                              ? 'badge-success'
                              : 'badge-warning'
                          }`}
                        >
                          {user.company.subscriptionStatus}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Licenses</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {user.company.licensesUsed} / {user.company.licenseCount} used
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">You're not associated with any company</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security</h2>
              <div className="space-y-6">
                {/* Connected accounts */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="text-gray-900">Google</span>
                      </div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z" />
                          <path fill="#81bc06" d="M12 1h10v10H12z" />
                          <path fill="#05a6f0" d="M1 12h10v10H1z" />
                          <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        <span className="text-gray-900">Microsoft</span>
                      </div>
                      <span className="text-sm text-gray-500">Not connected</span>
                    </div>
                  </div>
                </div>

                {/* Session info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Session</h3>
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Last login:{' '}
                      <span className="font-medium text-gray-900">
                        {user?.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString()
                          : 'Unknown'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

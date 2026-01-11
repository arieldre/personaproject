import { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import {
  Users,
  Search,
  Plus,
  Loader2,
  MoreVertical,
  Mail,
  UserCheck,
  UserX,
  Shield,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage = () => {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        usersAPI.list({ companyId: currentUser?.company?.id }),
        usersAPI.getInvitations({ companyId: currentUser?.company?.id }),
      ]);
      setUsers(usersRes.data.users);
      setInvitations(invitesRes.data.invitations);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await usersAPI.updateStatus(userId, !isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
      );
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('User role updated');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const revokeInvitation = async (inviteId) => {
    try {
      await usersAPI.revokeInvitation(inviteId);
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success('Invitation revoked');
    } catch (error) {
      toast.error('Failed to revoke invitation');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  const UserRow = ({ user }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isCurrentUser = user.id === currentUser?.id;

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-primary-700">
                  {user.first_name?.[0]}
                  {user.last_name?.[0]}
                </span>
              )}
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">
                {user.first_name} {user.last_name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`badge capitalize ${
              user.role === 'super_admin'
                ? 'badge-primary'
                : user.role === 'company_admin'
                ? 'badge-warning'
                : 'badge-gray'
            }`}
          >
            {user.role.replace('_', ' ')}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={user.is_active ? 'badge-success' : 'badge-danger'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user.last_login_at
            ? new Date(user.last_login_at).toLocaleDateString()
            : 'Never'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          {!isCurrentUser && user.role !== 'super_admin' && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        toggleUserStatus(user.id, user.is_active);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        changeUserRole(
                          user.id,
                          user.role === 'company_admin' ? 'user' : 'company_admin'
                        );
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Shield className="w-4 h-4" />
                      {user.role === 'company_admin'
                        ? 'Remove admin'
                        : 'Make admin'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  const InviteModal = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [sending, setSending] = useState(false);

    const handleInvite = async (e) => {
      e.preventDefault();
      setSending(true);
      try {
        await usersAPI.invite({ email, role });
        toast.success('Invitation sent!');
        setShowInviteModal(false);
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to send invitation');
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              >
                <option value="user">User</option>
                <option value="company_admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary flex-1"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your team and send invitations
          </p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Invitations ({pendingInvitations.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : activeTab === 'users' ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingInvitations.length > 0 ? (
            pendingInvitations.map((invite) => (
              <div key={invite.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited as {invite.role.replace('_', ' ')} • Expires{' '}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeInvitation(invite.id)}
                  className="btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            ))
          ) : (
            <div className="card p-12 text-center">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No pending invitations</p>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && <InviteModal />}
    </div>
  );
};

export default UsersPage;

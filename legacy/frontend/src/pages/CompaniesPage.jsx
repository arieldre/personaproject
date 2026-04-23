import { useEffect, useState } from 'react';
import { companiesAPI } from '../services/api';
import {
  Building2,
  Search,
  Plus,
  Loader2,
  MoreVertical,
  Users,
  Trash2,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.list({ search: searchQuery || undefined });
      setCompanies(response.data.companies);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const deleteCompany = async (id) => {
    if (!confirm('Are you sure you want to delete this company? This will delete all associated users, questionnaires, and personas.')) {
      return;
    }
    try {
      await companiesAPI.delete(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast.success('Company deleted');
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-gray',
      suspended: 'badge-danger',
      trial: 'badge-warning',
    };
    return badges[status] || 'badge-gray';
  };

  const CompanyCard = ({ company }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
      <div className="card p-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                <span className={getStatusBadge(company.subscription_status)}>
                  {company.subscription_status}
                </span>
              </div>
              <p className="text-sm text-gray-500">{company.slug}</p>
              {company.industry && (
                <p className="text-sm text-gray-500 mt-1">{company.industry}</p>
              )}
            </div>
          </div>

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
                      setEditingCompany(company);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      deleteCompany(company.id);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-lg font-semibold text-gray-900">
              {company.licenses_used} / {company.license_count}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Personas</p>
            <p className="text-lg font-semibold text-gray-900">{company.persona_count || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(company.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const CompanyModal = ({ company, onClose }) => {
    const isEditing = !!company;
    const [formData, setFormData] = useState({
      name: company?.name || '',
      industry: company?.industry || '',
      companySize: company?.company_size || 'medium',
      licenseCount: company?.license_count || 10,
      subscriptionStatus: company?.subscription_status || 'active',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSaving(true);
      try {
        if (isEditing) {
          await companiesAPI.update(company.id, formData);
          if (formData.licenseCount !== company.license_count || formData.subscriptionStatus !== company.subscription_status) {
            await companiesAPI.updateLicenses(company.id, {
              licenseCount: formData.licenseCount,
              subscriptionStatus: formData.subscriptionStatus,
            });
          }
          toast.success('Company updated');
        } else {
          await companiesAPI.create(formData);
          toast.success('Company created');
        }
        onClose();
        fetchCompanies();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to save company');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isEditing ? 'Edit Company' : 'Create Company'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Acme Inc."
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                placeholder="Technology"
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Company Size</label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companySize: e.target.value }))}
                  className="input"
                >
                  <option value="small">Small (1-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
              </div>
              <div>
                <label className="label">License Count</label>
                <input
                  type="number"
                  value={formData.licenseCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, licenseCount: parseInt(e.target.value) }))}
                  min="1"
                  max="10000"
                  className="input"
                />
              </div>
            </div>
            {isEditing && (
              <div>
                <label className="label">Subscription Status</label>
                <select
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subscriptionStatus: e.target.value }))}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="trial">Trial</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Save' : 'Create'}
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
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">Manage all companies on the platform</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Companies grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No companies found' : 'No companies yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery ? 'Try adjusting your search' : 'Create your first company to get started'}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CompanyModal onClose={() => setShowCreateModal(false)} />
      )}
      {editingCompany && (
        <CompanyModal company={editingCompany} onClose={() => setEditingCompany(null)} />
      )}
    </div>
  );
};

export default CompaniesPage;

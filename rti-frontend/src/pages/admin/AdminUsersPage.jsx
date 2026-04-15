import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Edit, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formState, setFormState] = useState({
    email: '',
    full_name: '',
    role: 'citizen',
    authority_id: '',
  });

  const [editState, setEditState] = useState({
    role: '',
    authority_id: '',
    is_active: true,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data),
  });

  const { data: authorities = [] } = useQuery({
    queryKey: ['admin-authorities'],
    queryFn: () => api.get('/admin/authorities').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/users', data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsCreating(false);
      setFormState({ email: '', full_name: '', role: 'citizen', authority_id: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    },
  });

  if (user?.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
          <h2>Access Denied</h2>
          <p>You need System Administrator privileges to view this page.</p>
        </div>
      </AdminLayout>
    );
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formState,
      authority_id: ['cpio', 'nodal_officer', 'faa'].includes(formState.role) ? formState.authority_id : null,
    });
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditState({
      role: u.role,
      authority_id: u.authority_id || '',
      is_active: u.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id) => {
    updateMutation.mutate({
      id,
      data: {
        ...editState,
        authority_id: ['cpio', 'nodal_officer', 'faa'].includes(editState.role) ? editState.authority_id : null,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users and their roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreating(true)} disabled={isCreating}>
          + Create User
        </button>
      </div>

      {isCreating && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card__header">
            <h2 className="card__title">Create New User</h2>
          </div>
          <form className="card__body" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label">Full Name</label>
                <input required className="input" type="text" value={formState.full_name} onChange={(e) => setFormState({ ...formState, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input required className="input" type="email" value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} />
              </div>
              <div>
                <label className="label">System Role</label>
                <select className="input" value={formState.role} onChange={(e) => setFormState({ ...formState, role: e.target.value })}>
                  <option value="citizen">Citizen</option>
                  <option value="cpio">CPIO</option>
                  <option value="nodal_officer">Nodal Officer</option>
                  <option value="faa">First Appellate Authority</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {['cpio', 'nodal_officer', 'faa'].includes(formState.role) && (
                <div>
                  <label className="label">Public Authority</label>
                  <select required className="input" value={formState.authority_id} onChange={(e) => setFormState({ ...formState, authority_id: e.target.value })}>
                    <option value="">Select Authority...</option>
                    {authorities.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card__body" style={{ padding: 0 }}>
          {isLoading ? (
            <p style={{ padding: 24 }}>Loading users...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Authority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      {editingId === u.id ? (
                        <select className="input" style={{ padding: '4px 8px', height: 'auto', fontSize: 13 }} value={editState.role} onChange={(e) => setEditState({ ...editState, role: e.target.value })}>
                           <option value="citizen">Citizen</option>
                           <option value="cpio">CPIO</option>
                           <option value="nodal_officer">Nodal Officer</option>
                           <option value="faa">FAA</option>
                           <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <span style={{ textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id && ['cpio', 'nodal_officer', 'faa'].includes(editState.role) ? (
                        <select className="input" style={{ padding: '4px 8px', height: 'auto', fontSize: 13, maxWidth: 200 }} value={editState.authority_id} onChange={(e) => setEditState({ ...editState, authority_id: e.target.value })}>
                           <option value="">None</option>
                           {authorities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: '#666' }}>{u.authority_name || '—'}</span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id ? (
                         <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                           <input type="checkbox" checked={editState.is_active} onChange={(e) => setEditState({ ...editState, is_active: e.target.checked })} />
                           Active
                         </label>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12, fontSize: 11, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b' }}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === u.id ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => saveEdit(u.id)} disabled={updateMutation.isPending} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}><Check size={18} /></button>
                          <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 4 }}>
                          <Edit size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

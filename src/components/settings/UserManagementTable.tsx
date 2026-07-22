import React, { useState, useEffect } from 'react';
import { Plus, UserMinus, UserCheck, Key, Edit, RefreshCw, X, Shield, ShieldAlert, CheckCircle } from 'lucide-react';
import { db, type User } from '../../database/db';
import { hashPassword } from '../../utils/crypto';
import Button from '../ui/Button';
import Input from '../ui/Input';
import showToast from '../../utils/toast';

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Cashier'>('Cashier');
  const [password, setPassword] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const records = await db.users.toArray();
      setUsers(records);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast.error('Failed to load user database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const clearForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setRole('Cashier');
    setPassword('');
    setSelectedUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      showToast.error('Please fill in all required fields.');
      return;
    }

    try {
      // Check if username/email already exists
      const existingUser = await db.users.where('username').equals(username.trim()).first();
      if (existingUser) {
        showToast.error('Username already taken. Please pick another.');
        return;
      }

      const existingEmail = await db.users.where('email').equals(email.trim()).first();
      if (existingEmail) {
        showToast.error('Email already registered.');
        return;
      }

      const hPassword = await hashPassword(password);
      await db.users.add({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash: hPassword,
        role: role,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      showToast.success('New user account registered successfully!');
      clearForm();
      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast.error(`Failed to register user: ${err.message || err}`);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !fullName || !username || !email) {
      showToast.error('Required fields must not be empty.');
      return;
    }

    try {
      // Validate unique username if changed
      if (username !== selectedUser.username) {
        const dupName = await db.users.where('username').equals(username.trim()).first();
        if (dupName) {
          showToast.error('Username is already in use.');
          return;
        }
      }

      await db.users.update(selectedUser.id!, {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: role,
        updatedAt: new Date()
      });

      showToast.success('User account details updated successfully!');
      clearForm();
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast.error(`Failed to update user: ${err.message || err}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) {
      showToast.error('Please enter a new password.');
      return;
    }

    try {
      const hPassword = await hashPassword(password);
      await db.users.update(selectedUser.id!, {
        passwordHash: hPassword,
        updatedAt: new Date()
      });

      showToast.success(`Password for ${selectedUser.username} updated successfully!`);
      clearForm();
      setShowResetModal(false);
    } catch (err: any) {
      showToast.error(`Failed to reset password: ${err.message || err}`);
    }
  };

  const toggleUserStatus = async (user: User) => {
    // Prevent self-deactivation of system administrator
    if (user.username === 'admin') {
      showToast.error('Primary system administrator cannot be deactivated.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await db.users.update(user.id!, {
        status: nextStatus,
        updatedAt: new Date()
      });
      showToast.success(`User ${user.username} is now ${nextStatus === 'active' ? 'Active' : 'Deactivated'}.`);
      fetchUsers();
    } catch (err: any) {
      showToast.error(`Failed to toggle account status: ${err.message || err}`);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setShowEditModal(true);
  };

  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setPassword('');
    setShowResetModal(true);
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Store Operators & Users</h3>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 leading-normal">
            Configure system authorization profiles, assign operator roles, or clear pass codes.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="xs"
          className="flex items-center gap-1.5 py-1.5 px-3 h-auto text-[10px] font-bold shrink-0 shadow-xs"
          onClick={() => { clearForm(); setShowAddModal(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add New User</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-850">
        <table className="w-full text-left border-collapse bg-white dark:bg-slate-950">
          <thead>
            <tr className="bg-slate-50/60 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850 text-[10px] font-extrabold uppercase text-slate-450 dark:text-slate-500 tracking-wider">
              <th className="px-4 py-2.5">Full Name</th>
              <th className="px-4 py-2.5">Username</th>
              <th className="px-4 py-2.5">Email & Contact</th>
              <th className="px-4 py-2.5 text-center">System Role</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-semibold text-slate-700 dark:text-slate-350">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white shrink-0">
                  {u.fullName}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  {u.username}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span>{u.email}</span>
                    {u.phone && <span className="text-[10px] font-semibold text-slate-450">{u.phone}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    u.role === 'Administrator' 
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/45'
                      : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/45'
                  }`}>
                    {u.role === 'Administrator' ? <Shield className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
                    <span>{u.role}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(u)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider hover:opacity-80 transition-opacity ${
                      u.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-400'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{u.status}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      title="Edit Profile"
                      onClick={() => openEditModal(u)}
                      className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Reset Password"
                      onClick={() => openResetModal(u)}
                      className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Key className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title={u.status === 'active' ? 'Deactivate Operator' : 'Activate Operator'}
                      disabled={u.username === 'admin'}
                      onClick={() => toggleUserStatus(u)}
                      className="p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 disabled:opacity-40 hover:text-red-500 transition-colors"
                    >
                      {u.status === 'active' ? <UserMinus className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Register Operator Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <Input label="Full Display Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. David Miller" />
              <div className="grid grid-cols-2 gap-3.5">
                <Input label="Username *" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. david_m" />
                <Input label="Email address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. david@shop.com" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 555-0199" />
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authorization Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Cashier">Cashier (POS & Sales)</option>
                    <option value="Administrator">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>
              <Input label="Password *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set initial password code" />
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">Register Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Modify User Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-3.5">
              <Input label="Full Display Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3.5">
                <Input label="Username *" value={username} onChange={(e) => setUsername(e.target.value)} />
                <Input label="Email address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Authorization Role *</label>
                  <select
                    value={role}
                    disabled={selectedUser?.username === 'admin'}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowResetModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850 p-5 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                <Key className="h-4 w-4 text-indigo-500" />
                <span>Reset Account Key</span>
              </h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                Resetting password code for operator <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">@{selectedUser?.username}</span>.
              </p>
              <Input label="New Password Code *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Type new login password" />
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setShowResetModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">Reset Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementTable;

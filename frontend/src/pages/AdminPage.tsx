import { useEffect, useState } from 'react'
import { adminGetUsers, adminGetTransactions, adminApproveTransaction, adminRejectTransaction } from '../lib/api'
import toast from 'react-hot-toast'
import { Users, Receipt, ShieldCheck, CheckCircle, XCircle, Trash2 } from 'lucide-react'

type Tab = 'users' | 'transactions'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([adminGetUsers(), adminGetTransactions()])
      .then(([u, t]) => { setUsers(u.data); setTransactions(t.data) })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false))
  }, [])

  const approve = async (txId: string) => {
    try {
      await adminApproveTransaction(txId)
      toast.success('Transaction approved')
      setTransactions(ts => ts.map(t => t.transaction_id === txId ? { ...t, status: 'approved' } : t))
    } catch { toast.error('Failed to approve') }
  }

  const reject = async (txId: string) => {
    try {
      await adminRejectTransaction(txId)
      toast.success('Transaction rejected')
      setTransactions(ts => ts.map(t => t.transaction_id === txId ? { ...t, status: 'rejected' } : t))
    } catch { toast.error('Failed to reject') }
  }

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'transactions' as Tab, label: 'Transactions', icon: Receipt },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#f6465d]/10 flex items-center justify-center">
          <ShieldCheck size={16} className="text-[#f6465d]" />
        </div>
        <h1 className="text-xl font-bold text-[#eaecef]">Admin Panel</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d] font-medium">Admin Only</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-[#f0b90b]' },
          { label: 'Active Users', value: users.filter(u => u.is_active).length, color: 'text-[#0ecb81]' },
          { label: 'Pending Transactions', value: transactions.filter(t => t.status === 'pending').length, color: 'text-[#f0b90b]' },
          { label: 'Total Transactions', value: transactions.length, color: 'text-[#848e9c]' },
        ].map(s => (
          <div key={s.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <p className="text-xs text-[#848e9c] mb-2">{s.label}</p>
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === id ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#848e9c] text-sm">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[#848e9c] text-sm">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-xs font-bold text-[#f0b90b]">
                        {u.email?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[#eaecef]">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-[#f0b90b]/10 text-[#f0b90b]' : 'bg-[#2b3139] text-[#848e9c]'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toast('Delete user (demo)')}
                      className="p-1.5 rounded-lg text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions table */}
      {tab === 'transactions' && (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                <th className="text-left px-4 py-3 font-medium">Transaction ID</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#848e9c] text-sm">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#848e9c] text-sm">No transactions found</td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.transaction_id} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-4 py-3 font-mono text-xs text-[#848e9c]">{tx.transaction_id?.slice(0, 16)}...</td>
                  <td className="px-4 py-3 text-[#eaecef]">{tx.user_email ?? tx.user_id}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#eaecef]">${tx.amount ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'approved' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' :
                      tx.status === 'rejected' ? 'bg-[#f6465d]/10 text-[#f6465d]' :
                      'bg-[#f0b90b]/10 text-[#f0b90b]'
                    }`}>{tx.status ?? 'pending'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(!tx.status || tx.status === 'pending') && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => approve(tx.transaction_id)}
                          className="p-1.5 rounded-lg text-[#0ecb81] hover:bg-[#0ecb81]/10 transition">
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => reject(tx.transaction_id)}
                          className="p-1.5 rounded-lg text-[#f6465d] hover:bg-[#f6465d]/10 transition">
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

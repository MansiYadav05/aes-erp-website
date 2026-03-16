import React, { useState, useEffect } from 'react';
import { 
  Users, BarChart3, Plus, Trash2, Edit2, MessageSquare, 
  Layout, CheckCircle, Clock, Bell, Send, Briefcase, 
  Settings, Globe, Info, Package, Phone, Mail, MapPin,
  Calendar, Cpu, Shield, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ employees: 0, inquiries: 0, tasks: 0 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<{ id: string, data: any } | null>(null);
  const [notificationForm, setNotificationForm] = useState({ user_id: '', title: '', message: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', deadline: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, empRes, inqRes, taskRes, deptRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/employees'),
        fetch('/api/inquiries'),
        fetch('/api/tasks'),
        fetch('/api/departments')
      ]);
      
      setStats(await statsRes.json());
      setEmployees(await empRes.json());
      setInquiries(await inqRes.json());
      setTasks(await taskRes.json());
      setDepartments(await deptRes.json());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiry = async (id: number, status: string) => {
    await fetch(`/api/inquiries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleDeleteInquiry = async (id: number) => {
    if (confirm('Delete this inquiry?')) {
      await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationForm)
    });
    setNotificationForm({ user_id: '', title: '', message: '' });
    alert('Notification sent!');
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm)
    });
    setTaskForm({ title: '', description: '', assigned_to: '', deadline: '' });
    fetchData();
    alert('Task assigned!');
  };

  const handleEditContent = async (pageId: string) => {
    try {
      const res = await fetch(`/api/content/${pageId}`);
      const data = await res.json();
      setEditingContent({ id: pageId, data: data || {} });
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;
    
    try {
      await fetch(`/api/content/${editingContent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContent.data)
      });
      setEditingContent(null);
      alert('Content updated successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingEmployee.id;
    await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingEmployee)
    });
    setEditingEmployee(null);
    setShowEmployeeModal(false);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-6 flex flex-col sticky top-0 h-screen">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-black tracking-tighter">
            AES<span className="text-emerald-500">ADMIN</span>
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Industrial ERP v2.0</p>
        </div>
        
        <nav className="space-y-1 flex-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart3 },
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'inquiries', label: 'Enquiries', icon: MessageSquare },
            { id: 'content', label: 'CMS', icon: Globe },
            { id: 'notifications', label: 'Broadcast', icon: Bell },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <X className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h1 className="text-3xl font-bold mb-8">System Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                      <Users className="text-blue-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Workforce</p>
                    <h3 className="text-4xl font-black">{stats.employees}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                      <MessageSquare className="text-emerald-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">New Enquiries</p>
                    <h3 className="text-4xl font-black">{stats.inquiries}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle className="text-purple-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Tasks</p>
                    <h3 className="text-4xl font-black">{stats.tasks}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Enquiries</h3>
                    <div className="space-y-4">
                      {inquiries.slice(0, 3).map((inq) => (
                        <div key={inq.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-sm">{inq.name}</p>
                            <p className="text-xs text-gray-500">{inq.reason}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            inq.status === 'new' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {inq.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Pending Tasks</h3>
                    <div className="space-y-4">
                      {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500">Assigned to: {task.employee_name}</p>
                          </div>
                          <p className="text-xs font-bold text-gray-400">{task.deadline}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'employees' && (
              <motion.div key="employees" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold">Employee Management</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Role & Dept</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Salary</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500">
                                {emp.first_name[0]}{emp.last_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{emp.first_name} {emp.last_name}</p>
                                <p className="text-xs text-gray-400">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-bold text-gray-700">{emp.role_title || 'Unassigned'}</p>
                            <p className="text-xs text-gray-400">{emp.department_name || 'No Department'}</p>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-900">
                            ${(emp.salary_monthly || 0).toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }}
                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Task Management</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-10">
                      <h3 className="text-xl font-bold mb-6">Assign New Task</h3>
                      <form onSubmit={handleAssignTask} className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Task Title</label>
                          <input 
                            required
                            type="text"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                            placeholder="e.g., Inventory Audit"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assign To</label>
                          <select 
                            required
                            value={taskForm.assigned_to}
                            onChange={(e) => setTaskForm({...taskForm, assigned_to: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                          >
                            <option value="">Select Employee</option>
                            {employees.map(e => (
                              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deadline</label>
                          <input 
                            required
                            type="date"
                            value={taskForm.deadline}
                            onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                          <textarea 
                            required
                            rows={3}
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all resize-none"
                            placeholder="Task details..."
                          />
                        </div>
                        <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center">
                          Assign Task <Send className="ml-2 w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Task</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned To</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Deadline</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-5">
                                <p className="font-bold text-sm">{task.title}</p>
                                <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
                              </td>
                              <td className="px-8 py-5 text-sm text-gray-600">{task.employee_name}</td>
                              <td className="px-8 py-5 text-sm font-bold text-gray-400">{task.deadline}</td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {task.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'inquiries' && (
              <motion.div key="inquiries" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Contact Enquiries</h1>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Sender</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Meeting</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-sm">{inq.name}</p>
                            <p className="text-xs text-gray-400">{inq.email}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm text-gray-600 line-clamp-2">{inq.reason}</p>
                          </td>
                          <td className="px-8 py-5 text-sm text-gray-500">
                            {inq.meeting_time ? new Date(inq.meeting_time).toLocaleString() : 'No meeting'}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              inq.status === 'new' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {inq.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end space-x-2">
                              {inq.status === 'new' && (
                                <button 
                                  onClick={() => handleUpdateInquiry(inq.id, 'responded')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Mark as Responded"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Broadcast Notifications</h1>
                <div className="max-w-2xl bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <form onSubmit={handleSendNotification} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Target Recipient</label>
                      <select 
                        value={notificationForm.user_id}
                        onChange={(e) => setNotificationForm({...notificationForm, user_id: e.target.value})}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                      >
                        <option value="">All Employees (Broadcast)</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Notification Title</label>
                      <input 
                        required
                        type="text"
                        value={notificationForm.title}
                        onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                        placeholder="e.g., Maintenance Alert"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Message Body</label>
                      <textarea 
                        required
                        rows={5}
                        value={notificationForm.message}
                        onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all resize-none"
                        placeholder="Type your message here..."
                      />
                    </div>
                    <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center">
                      Send Notification <Send className="ml-2 w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Website Content Management</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {['Home', 'About', 'Products', 'Services', 'Contact'].map((page) => (
                    <div key={page} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                        <Layout className="text-gray-400 w-7 h-7" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{page} Page</h3>
                      <p className="text-sm text-gray-500 mb-6">Manage hero text, images, and section content for the {page.toLowerCase()} page.</p>
                      <button 
                        onClick={() => handleEditContent(page.toLowerCase())}
                        className="w-full py-3 bg-gray-50 text-black font-bold rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
                      >
                        Edit Content
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Employee Edit Modal */}
      {showEmployeeModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Edit Employee Profile</h2>
              <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">First Name</label>
                <input 
                  required
                  type="text"
                  value={editingEmployee.first_name}
                  onChange={(e) => setEditingEmployee({...editingEmployee, first_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                <input 
                  required
                  type="text"
                  value={editingEmployee.last_name}
                  onChange={(e) => setEditingEmployee({...editingEmployee, last_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role Title</label>
                <input 
                  type="text"
                  value={editingEmployee.role_title || ''}
                  onChange={(e) => setEditingEmployee({...editingEmployee, role_title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                  placeholder="e.g., Senior Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                <select 
                  value={editingEmployee.department_id || ''}
                  onChange={(e) => setEditingEmployee({...editingEmployee, department_id: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Monthly Salary ($)</label>
                <input 
                  type="number"
                  value={editingEmployee.salary_monthly || 0}
                  onChange={(e) => setEditingEmployee({...editingEmployee, salary_monthly: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                <select 
                  value={editingEmployee.status}
                  onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Content Edit Modal */}
      {editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold capitalize">{editingContent.id} Page Content</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">JSON Editor</p>
              </div>
              <button onClick={() => setEditingContent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6">
                <textarea 
                  rows={15}
                  value={JSON.stringify(editingContent.data, null, 2)}
                  onChange={(e) => {
                    try {
                      const newData = JSON.parse(e.target.value);
                      setEditingContent({ ...editingContent, data: newData });
                    } catch (err) {
                      // Allow typing invalid JSON temporarily
                    }
                  }}
                  className="w-full bg-transparent text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                  placeholder='{"key": "value"}'
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                Note: Ensure the JSON structure matches the page requirements.
              </p>
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="flex-1 py-4 bg-gray-100 text-black font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

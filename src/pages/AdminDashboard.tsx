import React, { useState, useEffect } from 'react';
import {
  Users, BarChart3, Plus, Trash2, Edit2, MessageSquare,
  Layout, CheckCircle, Clock, Bell, Send, Briefcase,
  Settings, Globe, Info, Package, Phone, Mail, MapPin, IndianRupee, RefreshCw, Search,
  Calendar, Cpu, Shield, ArrowRight, X, ExternalLink, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';

const CMS_EDITOR_HELPERS: Record<string, { note: string, template: any }> = {
  home: {
    note: 'Edit only the words and image link inside hero. Keep the field names the same.',
    template: {
      hero: {
        tag: "Pioneering Industrial Excellence",
        title: "Precision Engineering Future-Ready Machinery",
        description: "We design and manufacture high-performance industrial machinery for global leaders in automobile, construction, and heavy engineering.",
        image: "https://example.com/hero-image.jpg"
      }
    }
  },
  about: {
    note: 'You can update hero text, mission, vision, goal, leadership cards, and milestones. Leadership and milestones must stay as lists.',
    template: {
      hero: {
        title: "Engineering the Industrial Future",
        description: "Update the about-page introduction here.",
        image: "https://example.com/about-image.jpg"
      },
      mission: "Write your mission here.",
      vision: "Write your vision here.",
      goal: "Write your business goal here.",
      leadership: [
        {
          name: "Leader Name",
          role: "Leader Role",
          bio: "Short leader biography.",
          image: "https://example.com/leader.jpg"
        }
      ],
      milestones: [
        {
          year: "2026",
          event: "Describe an important company milestone."
        }
      ]
    }
  },
  services: {
    note: 'Each item in services becomes one service card. Keep icon, color, and image fields for proper display.',
    template: {
      hero: {
        title: "Comprehensive Industrial Services",
        description: "Update the services page introduction here."
      },
      services: [
        {
          title: "Machine Installation",
          description: "Describe the service here.",
          icon: "Settings",
          color: "bg-blue-50 text-blue-600",
          image: "https://example.com/service-image.jpg"
        }
      ]
    }
  },
  contact: {
    note: 'This page is currently hardcoded and does not read CMS content yet. Saving here will store JSON, but it will not change the live contact page until the page is connected to CMS.',
    template: {
      hero: {
        title: "Contact Our Team",
        description: "Have questions about our machinery or need a technical consultation? Fill out the form below to get in touch."
      }
    }
  }
};

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ employees: 0, inquiries: 0, tasks: 0 });
  const [employees, setEmployees] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [geoSettings, setGeoSettings] = useState({ lat: 0, lng: 0, allowed_radius_meters: 100 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingMachine, setEditingMachine] = useState<any>(null);
  const [editingContent, setEditingContent] = useState<{ id: string, data: any } | null>(null);
  const [contentDraft, setContentDraft] = useState('');
  const [contentError, setContentError] = useState('');
  const [notificationForm, setNotificationForm] = useState({ user_id: '', title: '', message: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', deadline: '' });
  const [machineForm, setMachineForm] = useState({ name: '', model_number: '', description: '', price: 0, specifications: '{}' });
  const [newsletterForm, setNewsletterForm] = useState({ subject: '', message: '' });

  // Payroll state
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollEmployee, setPayrollEmployee] = useState<any>(null);
  const [payrollData, setPayrollData] = useState({ working_days: 30, present_days: 30, task_bonus_rate: 50 });
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const contentHelper = editingContent
    ? (CMS_EDITOR_HELPERS[editingContent.id] || {
      note: 'Edit the values carefully and keep the same field names.',
      template: { hero: { title: "Page title", description: "Page description" } }
    })
    : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/employees'),
        fetch('/api/inquiries'),
        fetch('/api/tasks'),
        fetch('/api/departments'),
        fetch('/api/settings/geo'),
        fetch('/api/machines'),
        fetch('/api/newsletter/subscribers')
      ]);

      // Map through responses and only parse JSON if content-type is correct and status is OK
      const data = await Promise.all(responses.map(async (res) => {
        if (!res.ok) return null;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return null;
      }));

      if (data[0]) setStats(data[0]);
      if (data[1]) setEmployees(data[1]);
      if (data[2]) setInquiries(data[2]);
      if (data[3]) setTasks(data[3]);
      if (data[4]) setDepartments(data[4]);
      if (data[5]) setGeoSettings(data[5]);
      if (data[6]) setMachines(data[6]);
      if (data[7]) setSubscribers(data[7]);
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
      const helper = CMS_EDITOR_HELPERS[pageId];
      const initialData = data || helper?.template || {};
      setEditingContent({ id: pageId, data: initialData });
      setContentDraft(JSON.stringify(initialData, null, 2));
      setContentError('');
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;

    try {
      const parsedContent = JSON.parse(contentDraft);
      setContentError('');
      await fetch(`/api/content/${editingContent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedContent)
      });
      setEditingContent({ ...editingContent, data: parsedContent });
      setEditingContent(null);
      alert('Content updated successfully!');
    } catch (error) {
      if (error instanceof SyntaxError) {
        setContentError('JSON format is invalid. Please check commas, quotes, and brackets.');
        return;
      }
      console.error('Error saving content:', error);
    }
  };

  const handleUpdateGeoSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings/geo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: geoSettings.lat,
          lng: geoSettings.lng,
          radius: geoSettings.allowed_radius_meters
        })
      });
      alert('Geo-fence settings updated successfully!');
      fetchData();
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings.');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.id) return;

    try {
      const id = editingEmployee.id;
      const payload = {
        first_name: editingEmployee.first_name || '',
        last_name: editingEmployee.last_name || '',
        role_title: editingEmployee.role_title || '',
        department_id: (editingEmployee.department_id === '' || editingEmployee.department_id === null || editingEmployee.department_id === undefined)
          ? null
          : parseInt(String(editingEmployee.department_id)),
        salary_monthly: parseFloat(String(editingEmployee.salary_monthly ?? 0)),
        task_bonus_rate: parseFloat(String(editingEmployee.task_bonus_rate ?? 50)),
        status: editingEmployee.status || 'active',
        role: editingEmployee.role || 'employee'
      };

      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error('Update failed');
      }

      setEditingEmployee(null);
      setShowEmployeeModal(false);
      setToast({ message: 'Employee profile updated successfully!', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error updating employee:', error);
      setToast({ message: 'Failed to update employee data.', type: 'error' });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This will remove their profile and access to the portal.')) {
      try {
        const response = await fetch(`/api/employees/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete employee');

        setToast({ message: 'Employee deleted successfully!', type: 'success' });
        fetchData();
      } catch (error) {
        console.error('Error deleting employee:', error);
        setToast({ message: 'Failed to delete employee.', type: 'error' });
      }
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      if (!response.ok) throw new Error('Failed to fetch attendance');

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML instead of JSON. Please ensure the server has been restarted.");
      }

      const data = await response.json();

      if (data.length === 0) {
        setToast({ message: 'No attendance records found to export.', type: 'error' });
        return;
      }

      const headers = ['Date', 'Employee ID', 'Employee Name', 'Status'];
      const csvRows = [
        headers.join(','),
        ...data.map((rec: any) => [
          rec.date,
          rec.employee_id,
          `"${rec.employee_name}"`,
          rec.status
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      setToast({ message: 'Attendance report downloaded!', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export attendance.', type: 'error' });
    }
  };

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsletterForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send broadcast');
      }

      setNewsletterForm({ subject: '', message: '' });
      setToast({ message: 'Newsletter broadcasted successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Failed to send newsletter.', type: 'error' });
    }
  };

  const handleSaveMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMachine ? `/api/machines/${editingMachine.id}` : '/api/machines';
      const method = editingMachine ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machineForm)
      });

      if (!response.ok) throw new Error('Action failed');

      setShowMachineModal(false);
      setEditingMachine(null);
      setMachineForm({ name: '', model_number: '', description: '', price: 0, specifications: '{}' });
      setToast({ message: `Machine ${editingMachine ? 'updated' : 'added'} successfully!`, type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Failed to save machine data.', type: 'error' });
    }
  };

  const handleDeleteMachine = async (id: number) => {
    if (confirm('Are you sure you want to delete this machinery from the catalog?')) {
      await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      setToast({ message: 'Machine deleted.', type: 'success' });
      fetchData();
    }
  };

  const handleOpenPayroll = async (emp: any) => {
    setPayrollEmployee(emp);
    try {
      const res = await fetch(`/api/attendance/${emp.id}`);
      const attendanceData = await res.json();
      const presentCount = attendanceData.filter((a: any) => a.status === 'present').length;

      setPayrollData({
        working_days: 30,
        present_days: presentCount,
        task_bonus_rate: emp.task_bonus_rate || 50
      });
      setShowPayrollModal(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setPayrollData({
        working_days: 30,
        present_days: 0,
        task_bonus_rate: emp.task_bonus_rate || 50
      });
      setShowPayrollModal(true);
    }
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const completedTasks = tasks.filter(t => t.assigned_to === payrollEmployee.id && t.status === 'completed').length;
    const attendanceFactor = payrollData.present_days / payrollData.working_days;
    const baseSalary = payrollEmployee.salary_monthly * attendanceFactor;
    const bonus = completedTasks * payrollData.task_bonus_rate;
    const totalPay = baseSalary + bonus;

    const date = new Date();
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    try {
      await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: payrollEmployee.id,
          amount: totalPay,
          bonus: bonus,
          payment_date: date.toISOString().split('T')[0],
          month_year: monthYear
        })
      });
      alert(`Payroll Processed for ${payrollEmployee.first_name}!\n\nBase Salary (Prorated): ₹${baseSalary.toFixed(2)}\nTask Bonus (${completedTasks} tasks): ₹${bonus.toFixed(2)}\n\nTotal Payout: ₹${totalPay.toFixed(2)}`);
      setShowPayrollModal(false);
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to save payroll record. Please try again.');
    }
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
            { id: 'newsletter', label: 'Newsletter', icon: Mail },
            { id: 'notifications', label: 'Broadcast', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
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
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span>Refresh Data</span>
              </button>
            </div>

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
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${inq.status === 'new' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
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
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search staff..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all text-sm w-48 md:w-64"
                        />
                      </div>
                      <button
                        onClick={handleExportAttendance}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Export Attendance</span>
                      </button>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all text-sm"
                      >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
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
                        {employees.filter(emp => {
                          const matchesDept = !selectedDepartment || emp.department_id == selectedDepartment;
                          const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
                          const matchesSearch = fullName.includes(searchTerm.toLowerCase());
                          return matchesDept && matchesSearch;
                        }).map((emp) => (
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
                              ₹{(emp.salary_monthly || 0).toLocaleString()}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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
                                <button
                                  onClick={() => handleOpenPayroll(emp)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Calculate Payroll"
                                >
                                  <IndianRupee className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete Employee"
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
                              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                              placeholder="e.g., Inventory Audit"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assign To</label>
                            <select
                              required
                              value={taskForm.assigned_to}
                              onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
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
                              onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                            <textarea
                              required
                              rows={3}
                              value={taskForm.description}
                              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
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
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Sender</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Company Name</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Product / Reason</th>
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
                              <td className="px-8 py-5 text-sm text-gray-600">{inq.company_name || 'N/A'}</td>
                              <td className="px-8 py-5">
                                <p className="font-bold text-sm">{inq.product_name || 'General Inquiry'}</p>
                                <p className="text-xs text-gray-400 line-clamp-2">{inq.reason}</p>
                              </td>
                              <td className="px-8 py-5 text-sm text-gray-500">
                                {inq.meeting_time ? new Date(inq.meeting_time).toLocaleString() : 'No meeting'}
                              </td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${inq.status === 'new' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
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
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">System Settings</h1>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Geo-Fence Section */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl">
                      <h2 className="text-xl font-bold mb-6 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
                        Geo-Fence Configuration
                      </h2>

                      <form onSubmit={handleUpdateGeoSettings} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={geoSettings.lat}
                              onChange={(e) => setGeoSettings({ ...geoSettings, lat: parseFloat(e.target.value) })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              required
                              value={geoSettings.lng}
                              onChange={(e) => setGeoSettings({ ...geoSettings, lng: parseFloat(e.target.value) })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Allowed Radius (Meters)</label>
                          <input
                            type="number"
                            required
                            value={geoSettings.allowed_radius_meters}
                            onChange={(e) => setGeoSettings({ ...geoSettings, allowed_radius_meters: parseFloat(e.target.value) })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                          />
                          <p className="text-xs text-gray-400 mt-2 ml-1">
                            Employees must be within this distance from the coordinates to mark attendance.
                          </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3">
                          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800 leading-relaxed">
                            To find coordinates: Open Google Maps, right-click on your office location, and copy the latitude and longitude (first item in the menu).
                          </p>
                        </div>

                        <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
                          Save Configuration
                        </button>
                      </form>
                    </div>

                    {/* Machinery Management Section */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center">
                          <Package className="w-5 h-5 mr-2 text-emerald-600" />
                          Machinery Catalog
                        </h2>
                        <button
                          onClick={() => {
                            setEditingMachine(null);
                            setMachineForm({ name: '', model_number: '', description: '', price: 0, specifications: '{}' });
                            setShowMachineModal(true);
                          }}
                          className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {machines.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                                <Cpu className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{m.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{m.model_number}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => {
                                setEditingMachine(m);
                                setMachineForm({ ...m });
                                setShowMachineModal(true);
                              }} className="p-2 text-gray-400 hover:text-black transition-all">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMachine(m.id)} className="p-2 text-red-400 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                          onChange={(e) => setNotificationForm({ ...notificationForm, user_id: e.target.value })}
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
                          onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
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
                          onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
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

              {activeTab === 'newsletter' && (
                <motion.div key="newsletter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-3xl font-bold mb-8">Newsletter Management</h1>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold mb-6">Compose Broadcast</h3>
                        <form onSubmit={handleSendNewsletter} className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                            <input
                              required
                              type="text"
                              value={newsletterForm.subject}
                              onChange={(e) => setNewsletterForm({ ...newsletterForm, subject: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                              placeholder="e.g., Monthly Product Updates"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message Body</label>
                            <textarea
                              required
                              rows={6}
                              value={newsletterForm.message}
                              onChange={(e) => setNewsletterForm({ ...newsletterForm, message: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all resize-none"
                              placeholder="Enter newsletter content..."
                            />
                          </div>
                          <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center">
                            Send to {subscribers.length} Subscribers <Send className="ml-2 w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</th>
                              <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Subscribed On</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {subscribers.map((sub) => (
                              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-5 text-sm font-bold text-gray-700">{sub.email}</td>
                                <td className="px-8 py-5 text-sm text-gray-400">{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                            {subscribers.length === 0 && (
                              <tr><td colSpan={2} className="px-8 py-10 text-center text-gray-400 italic">No subscribers yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'content' && (
                <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-3xl font-bold mb-8">Website Content Management</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {['Home', 'About', 'Services', 'Contact'].map((page) => (
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
          </>
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
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, first_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                <input
                  required
                  type="text"
                  value={editingEmployee.last_name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, last_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role Title</label>
                <input
                  type="text"
                  value={editingEmployee.role_title || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role_title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                  placeholder="e.g., Senior Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Department</label>
                <select
                  value={editingEmployee.department_id || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, department_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={editingEmployee.salary_monthly ?? ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, salary_monthly: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Task Bonus Rate (₹)</label>
                <input
                  type="number"
                  value={editingEmployee.task_bonus_rate ?? ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, task_bonus_rate: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                <select
                  value={editingEmployee.status}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
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

      {/* Machine Add/Edit Modal */}
      {showMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{editingMachine ? 'Edit Machinery' : 'Add New Machinery'}</h2>
              <button onClick={() => setShowMachineModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveMachine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Machine Name</label>
                  <input required value={machineForm.name} onChange={e => setMachineForm({ ...machineForm, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Model Number</label>
                  <input required value={machineForm.model_number} onChange={e => setMachineForm({ ...machineForm, model_number: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea rows={2} value={machineForm.description || ''} onChange={e => setMachineForm({ ...machineForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (₹)</label>
                <input type="number" value={machineForm.price} onChange={e => setMachineForm({ ...machineForm, price: parseFloat(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Specifications (JSON)</label>
                <textarea rows={3} value={machineForm.specifications} onChange={e => setMachineForm({ ...machineForm, specifications: e.target.value })} className="w-full px-4 py-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none resize-none" placeholder='{"weight": "10 tons"}' />
              </div>
              <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
                {editingMachine ? 'Update Machine' : 'Add Machine'}
              </button>
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
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Easy JSON Editor</p>
              </div>
              <button onClick={() => {
                setEditingContent(null);
                setContentDraft('');
                setContentError('');
              }} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-emerald-900 mb-2">Helper Syntax</p>
                <p className="text-sm text-emerald-800 leading-relaxed">{contentHelper?.note}</p>
                <div className="mt-4 grid gap-2 text-xs text-emerald-900">
                  <p>1. Change only the text after the `:`.</p>
                  <p>2. Keep all field names like `title`, `description`, `image`, `services` exactly the same.</p>
                  <p>3. Use double quotes only, like `"title": "New text"`.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContentDraft(JSON.stringify(contentHelper?.template || {}, null, 2));
                    setContentError('');
                  }}
                  className="mt-4 px-4 py-2 bg-white text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all"
                >
                  Load Helper Template
                </button>
              </div>

              <div className="bg-gray-900 rounded-2xl p-6">
                <textarea
                  rows={18}
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                  className="w-full bg-transparent text-emerald-400 font-mono text-sm focus:outline-none resize-none"
                  placeholder='{"key": "value"}'
                />
              </div>
              {contentError && (
                <p className="text-sm text-red-600 font-bold text-center">
                  {contentError}
                </p>
              )}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Example</p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(contentHelper?.template || {}, null, 2)}
                </pre>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingContent(null);
                    setContentDraft('');
                    setContentError('');
                  }}
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

      {/* Payroll Modal */}
      {showPayrollModal && payrollEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Process Payroll</h2>
                <p className="text-sm text-gray-500">{payrollEmployee.first_name} {payrollEmployee.last_name}</p>
              </div>
              <button onClick={() => setShowPayrollModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProcessPayroll} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Working Days</label>
                  <input
                    type="number"
                    value={payrollData.working_days}
                    onChange={(e) => setPayrollData({ ...payrollData, working_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-black transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Days Present</label>
                  <input
                    type="number"
                    max={payrollData.working_days}
                    value={payrollData.present_days}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl focus:outline-none text-gray-500 cursor-not-allowed transition-all"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Base Salary (Monthly)</span>
                  <span className="font-bold">₹{payrollEmployee.salary_monthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Attendance Adjustment</span>
                  <span className="font-bold text-red-500">
                    - ₹{Math.round(payrollEmployee.salary_monthly * (1 - (payrollData.present_days / payrollData.working_days))).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Completed Tasks ({tasks.filter(t => t.assigned_to === payrollEmployee.id && t.status === 'completed').length})</span>
                  <span className="font-bold text-emerald-600">
                    + ₹{(tasks.filter(t => t.assigned_to === payrollEmployee.id && t.status === 'completed').length * payrollData.task_bonus_rate).toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-emerald-200 flex justify-between items-center">
                  <span className="font-bold text-emerald-900 uppercase tracking-widest text-xs">Total Payout</span>
                  <span className="font-black text-2xl text-emerald-900">
                    ₹{Math.round(
                      (payrollEmployee.salary_monthly * (payrollData.present_days / payrollData.working_days)) +
                      (tasks.filter(t => t.assigned_to === payrollEmployee.id && t.status === 'completed').length * payrollData.task_bonus_rate)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center">
                <CheckCircle className="mr-2 w-5 h-5" /> Confirm Payout
              </button>
            </form>

          </motion.div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm whitespace-nowrap">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

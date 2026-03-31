import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, Calendar, Clock, Bell, CheckCircle,
  IndianRupee, MapPin, Phone, Mail, Award, ArrowRight, Loader,
  TrendingUp, AlertCircle, X, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';

export const EmployeeDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [taskRes, notifRes, attRes, salRes] = await Promise.all([
        fetch(`/api/tasks?employeeId=${user?.uid}`),
        fetch(`/api/notifications?userId=${user?.uid}`),
        fetch(`/api/attendance/${user?.uid}`),
        fetch(`/api/salary/${user?.uid}`)
      ]);

      setTasks(await taskRes.json());
      setNotifications(await notifRes.json());
      setAttendance(await attRes.json());
      setSalaryHistory(await salRes.json());
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchEmployeeData();
  };

  const handleMarkAttendance = async () => {
    if (isClockingIn) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsClockingIn(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const res = await fetch('/api/attendance/geo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: user?.uid,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          fetchEmployeeData();
        } else {
          alert(`ERROR: ${data.error}\nDistance from office: ${data.distance} meters.`);
        }
      } catch (error) {
        console.error("Attendance error:", error);
        alert("Failed to connect to server.");
      } finally {
        setIsClockingIn(false);
      }
    }, (error) => {
      console.error("GPS Error:", error);
      let msg = "Unable to retrieve your location.";
      if (error.code === 1) msg = "Location permission denied. Please allow access.";
      if (error.code === 2) msg = "Location unavailable. Check your GPS.";
      if (error.code === 3) msg = "Location request timed out.";
      alert(msg);
      setIsClockingIn(false);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleDownloadSlip = (slip: any) => {
    const doc = new jsPDF();

    // Colors
    const emerald = [0, 0, 0]; // Changed to Black as requested
    const dark = [20, 20, 20];
    const gray = [100, 100, 100];
    const lightGray = [245, 245, 245];

    // Header Background
    doc.setFillColor(emerald[0], emerald[1], emerald[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // Logo / Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("AES", 20, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Authensia Equipment Systems", 20, 32);
    doc.text("Dehu Alandi Road, Pune", 20, 37);

    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PAYSLIP", 190, 25, { align: 'right' });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(slip.month_year, 190, 35, { align: 'right' });

    let y = 80;

    // Employee Section
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE DETAILS", 20, 70);
    doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 73, 190, 73);

    // Employee Info Grid
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.text("NAME", 20, y);
    doc.text("EMPLOYEE ID", 20, y + 10);
    doc.text("DEPARTMENT", 20, y + 20);

    doc.text("ROLE", 110, y);
    doc.text("PAYMENT DATE", 110, y + 10);
    doc.text("STATUS", 110, y + 20);

    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont("helvetica", "normal");

    doc.text(`${profile?.first_name} ${profile?.last_name}`, 60, y);
    doc.text(`${profile?.id?.slice(0, 8).toUpperCase()}`, 60, y + 10);
    doc.text(`${profile?.department_name || 'N/A'}`, 60, y + 20);

    doc.text(`${profile?.role_title}`, 150, y);
    doc.text(`${slip.payment_date}`, 150, y + 10);
    doc.text("Paid", 150, y + 20);

    // Earnings Section
    y = 140;
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS", 20, y);
    doc.line(20, y + 3, 190, y + 3);

    y += 15;

    // Table Header
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, y - 5, 170, 10, 'F');
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, y + 2);
    doc.text("Amount", 180, y + 2, { align: 'right' });

    y += 15;

    // Items
    doc.setFont("helvetica", "normal");
    doc.setTextColor(gray[0], gray[1], gray[2]);

    // Base Salary
    doc.text("Base Salary (Including Attendance Adj.)", 25, y);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(`Rs. ${(slip.amount - slip.bonus).toLocaleString()}`, 180, y, { align: 'right' });

    y += 10;

    // Bonus
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text("Task Performance Bonus", 25, y);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(`Rs. ${slip.bonus.toLocaleString()}`, 180, y, { align: 'right' });

    y += 20;

    // Total
    doc.setDrawColor(200, 200, 200);
    doc.line(110, y, 190, y);
    y += 10;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text("NET PAY", 110, y);
    doc.text(`Rs. ${slip.amount.toLocaleString()}`, 180, y, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by AES Industrial ERP System", 105, 280, { align: 'center' });
    doc.text("Thank you for your hard work!", 105, 285, { align: 'center' });

    doc.save(`Payslip_AES_${slip.month_year.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col sticky top-0 h-screen">
        <div className="mb-10 px-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <User className="text-white w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Employee Portal</h2>
          <p className="text-xs text-gray-400 font-medium">Welcome back, {profile?.first_name || 'User'}</p>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'tasks', label: 'My Tasks', icon: CheckCircle },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'salary', label: 'Salary & Pay', icon: IndianRupee },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-black text-white shadow-lg shadow-gray-200'
                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mb-4"
          >
            <X className="w-5 h-5" />
            <span>Logout</span>
          </button>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Shift Status</p>
            <p className="text-xs font-bold text-emerald-900">Active • On Duty</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold">{getGreeting()}, {profile?.first_name}!</h1>
                    <p className="text-gray-500">Here's what's happening today at AESERP.</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleMarkAttendance}
                      disabled={isClockingIn}
                      className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isClockingIn ? <><Loader className="w-5 h-5 mr-2 animate-spin" /> Locating...</> : 'Clock In'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle className="text-blue-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Tasks</p>
                    <h3 className="text-4xl font-black">{tasks.filter(t => t.status !== 'completed').length}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                      <Bell className="text-orange-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Unread Alerts</p>
                    <h3 className="text-4xl font-black">{notifications.filter(n => !n.is_read).length}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                      <Calendar className="text-purple-600 w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Attendance Rate</p>
                    <h3 className="text-4xl font-black">{attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0}%</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Notifications</h3>
                    <div className="space-y-4">
                      {notifications.slice(0, 3).map((notif) => (
                        <div key={notif.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                            <AlertCircle className="text-orange-500 w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{notif.title}</p>
                            <p className="text-xs text-gray-500">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && <p className="text-center text-gray-400 py-4 text-sm italic">No notifications yet.</p>}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Priority Tasks</h3>
                    <div className="space-y-4">
                      {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div>
                            <p className="font-bold text-sm">{task.title}</p>
                            <p className="text-xs text-gray-500">Deadline: {task.deadline}</p>
                          </div>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {tasks.filter(t => t.status !== 'completed').length === 0 && (
                        <p className="text-center text-gray-400 py-4 text-sm italic">All caught up! No pending tasks.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">My Assigned Tasks</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-bold text-gray-400">Due: {task.deadline}</p>
                      </div>
                      <h3 className="text-xl font-bold mb-3">{task.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-8">{task.description}</p>

                      <div className="flex space-x-3">
                        {task.status !== 'completed' && (
                          <>
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                className="flex-1 py-3 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all"
                              >
                                Start Task
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                className="flex-1 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all"
                              >
                                Mark Completed
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-32 bg-black relative">
                    <div className="absolute -bottom-12 left-12 w-24 h-24 bg-white rounded-3xl p-1 shadow-xl">
                      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center font-black text-3xl text-gray-400">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </div>
                    </div>
                  </div>
                  <div className="pt-16 pb-12 px-12">
                    <div className="flex justify-between items-start mb-12">
                      <div>
                        <h2 className="text-3xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
                        <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm mt-1">{profile?.role_title || 'Employee'}</p>
                      </div>
                      <div className="flex space-x-3">
                        <span className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">
                          {profile?.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">Contact Information</h3>
                        <div className="space-y-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Mail className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
                              <p className="text-sm font-bold">{profile?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Phone className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                              <p className="text-sm font-bold">{profile?.phone || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Home Address</p>
                              <p className="text-sm font-bold">{profile?.address || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-4">Employment Details</h3>
                        <div className="space-y-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</p>
                              <p className="text-sm font-bold">{profile?.department_name || 'Unassigned'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joining Date</p>
                              <p className="text-sm font-bold">{profile?.hire_date}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                              <Award className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee ID</p>
                              <p className="text-sm font-bold">#{profile?.id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Attendance Records</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Present Days</p>
                    <h3 className="text-4xl font-black text-emerald-600">{presentDays}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Absent Days</p>
                    <h3 className="text-4xl font-black text-red-600">{absentDays}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Records</p>
                    <h3 className="text-4xl font-black text-gray-900">{attendance.length}</h3>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-gray-700">{record.date}</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm text-gray-400">Regular Shift</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'salary' && (
              <motion.div key="salary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold mb-8">Salary & Payment History</h1>
                <div className="bg-black text-white p-10 rounded-[2.5rem] mb-10 flex flex-col md:flex-row justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Monthly Salary</p>
                    <h3 className="text-5xl font-black">₹{(profile?.salary_monthly || 0).toLocaleString()}</h3>
                  </div>
                  <div className="mt-8 md:mt-0 text-left md:text-right">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Est. Task Bonus</p>
                      <p className="text-2xl font-bold">+₹{(completedTasksCount * (profile?.task_bonus_rate || 50)).toLocaleString()}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Next Payout</p>
                    <p className="text-lg font-bold">March 31, 2024</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-6">Payment History</h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Month</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Bonus</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salaryHistory.map((sal) => (
                        <tr key={sal.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-sm font-bold text-gray-700">{sal.month_year}</td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-900">₹{sal.amount.toLocaleString()}</td>
                          <td className="px-8 py-5 text-sm font-bold text-emerald-600">+₹{sal.bonus.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                              Paid
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => handleDownloadSlip(sal)}
                              className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {salaryHistory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-10 text-center text-gray-400 text-sm italic">
                            No payment history available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

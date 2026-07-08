
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoutEntry } from '../types';

interface Log {
  id: string;
  type: 'INFO' | 'WARN' | 'DANGER' | 'SUCCESS';
  msg: string;
  time: string;
}

interface AdminDashboardProps {
  shouts: ShoutEntry[];
  users: User[];
  onLockdownToggle: (val: boolean) => void;
  onMaintenanceToggle: (val: boolean) => void;
  isLockdown: boolean;
  isMaintenance: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  shouts, users, onLockdownToggle, onMaintenanceToggle, isLockdown, isMaintenance 
}) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'shouts' | 'broadcast'>('stats');
  const logEndRef = useRef<HTMLDivElement>(null);

  // Simulate Live System Logs
  useEffect(() => {
    const events = [
      "New User Registered: @dev_user",
      "Shout #102 Deleted by Moderator",
      "Shadow Ban Applied to @troll_king",
      "Global Lockdown Mode: Deactivated",
      "API Gateway: 200 OK (24ms)",
      "Pin #45 Expired automatically",
      "Database Backup Completed (452MB)",
      "New Support Ticket #881 Received"
    ];

    const interval = setInterval(() => {
      const newLog: Log = {
        id: Math.random().toString(36),
        type: Math.random() > 0.8 ? 'WARN' : 'INFO',
        msg: events[Math.floor(Math.random() * events.length)],
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setLogs(prev => [...prev.slice(-15), newLog]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 bg-slate-950 rounded-[3rem] border border-slate-900 overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
    >
      {/* Top Header */}
      <div className="bg-slate-900/50 p-8 border-b border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]"></span>
            <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Orchestration <span className="text-purple-500">Panel</span></h2>
          </div>
          <p className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Authorized Access Layer • V4.2.0</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => onLockdownToggle(!isLockdown)}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all border ${
              isLockdown 
                ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isLockdown ? '🔓 Disable Lockdown' : '🔒 Global Lockdown'}
          </button>
          <button 
            onClick={() => onMaintenanceToggle(!isMaintenance)}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all border ${
              isMaintenance 
                ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-lg' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isMaintenance ? '🛠️ Live Mode' : '🚧 Maint. Mode'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[600px]">
        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto admin-scroll bg-slate-950">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {['stats', 'users', 'shouts', 'broadcast'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-6"
              >
                {[
                  { l: 'Active Users', v: '2.4K', t: '+12%', c: 'text-emerald-400' },
                  { l: 'Daily Shouts', v: '892', t: '-3%', c: 'text-red-400' },
                  { l: 'Revenue', v: '৳12.5k', t: '+44%', c: 'text-purple-400' }
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900/30 border border-slate-900 p-6 rounded-[2rem]">
                    <p className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest mb-2">{s.l}</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <p className="text-3xl font-black text-white">{s.v}</p>
                      <span className={`text-xs sm:text-sm font-bold pb-1 ${s.c}`}>{s.t}</span>
                    </div>
                    <div className="w-full h-12 mt-4 bg-slate-900/50 rounded-xl overflow-hidden relative">
                       {/* Simulated Sparkline */}
                       <div className="absolute inset-0 flex flex-wrap items-end gap-1 px-2 pb-2">
                          {[4,7,3,8,5,9,4,6,8,5].map((h, idx) => (
                            <div key={idx} className={`w-full bg-purple-500/40 rounded-t-sm`} style={{ height: `${h * 10}%` }}></div>
                          ))}
                       </div>
                    </div>
                  </div>
                ))}

                <div className="col-span-full bg-slate-900/30 border border-slate-900 p-8 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Platform Traffic Flow</h4>
                    <span className="text-xs sm:text-sm font-black text-slate-500">LAST 24 HOURS</span>
                  </div>
                  <div className="h-48 flex flex-wrap items-end gap-2 px-4 border-b border-slate-800">
                     {[20, 35, 25, 60, 45, 75, 55, 80, 70, 95, 85, 100].map((v, i) => (
                       <div key={i} className="group relative flex-1">
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{v}%</div>
                          <div className="w-full bg-gradient-to-t from-purple-900/50 to-purple-500 rounded-t-lg transition-all duration-700" style={{ height: `${v}%` }}></div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/50 p-4 rounded-2xl flex flex-wrap gap-3 border border-slate-800">
                  <input placeholder="Search UID, Device ID, or Username..." className="flex-1 bg-transparent border-none text-xs text-white outline-none" />
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase">Search</button>
                </div>
                
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden">
                   <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-900/80 text-slate-500 font-black uppercase tracking-widest">
                        <tr>
                          <th className="p-4">User Identity</th>
                          <th className="p-4">Authorization</th>
                          <th className="p-4">Metric</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-300">
                        {users.slice(0, 5).map(u => (
                          <tr key={u.id} className="border-t border-slate-900 hover:bg-white/5 transition-colors">
                            <td className="p-4 flex flex-wrap items-center gap-3">
                               <img src={u.avatar} className="w-8 h-8 rounded-lg grayscale" alt="" />
                               <div>
                                  <p className="font-bold text-white">@{u.username}</p>
                                  <p className="opacity-40">UID: {u.id.substring(0,8)}</p>
                                </div>
                            </td>
                            <td className="p-4">
                               <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 uppercase font-black text-xs">{u.role || 'USER'}</span>
                            </td>
                            <td className="p-4 font-mono">{u.points} PTS</td>
                            <td className="p-4 text-right space-x-2">
                               <button className="text-slate-500 hover:text-white transition-colors" title="Shadow Ban">👻</button>
                               <button className="text-slate-500 hover:text-red-500 transition-colors" title="Device ID Ban">📵</button>
                               <button className="text-slate-500 hover:text-purple-400 transition-colors" title="Edit Permissions">⚙️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'broadcast' && (
              <motion.div key="broadcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-900">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Global Signal Dispatch</h4>
                    <div className="space-y-4">
                       <input placeholder="Broadcast Title (e.g. Server Maintenance)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none focus:ring-1 ring-purple-500" />
                       <textarea placeholder="Message body..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white h-32 outline-none focus:ring-1 ring-purple-50" />
                       <div className="flex flex-wrap gap-4">
                          <select className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 text-xs sm:text-sm p-3 rounded-2xl outline-none">
                             <option>ALL USERS</option>
                             <option>PREMIUM ONLY</option>
                             <option>STAFF & MODS</option>
                          </select>
                          <button className="bg-purple-600 text-white px-10 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-purple-900/20">Send Signal</button>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Real-time Logs Sidebar */}
        <div className="w-full lg:w-80 bg-slate-900/30 border-l border-slate-900 flex flex-col overflow-hidden">
           <div className="p-5 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">System Logs</span>
              <div className="flex flex-wrap gap-1">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 admin-scroll bg-[#05080f]">
              {logs.map(log => (
                <div key={log.id} className="font-mono text-xs group animate-in slide-in-from-right-2">
                   <span className="text-slate-600">[{log.time}]</span>{' '}
                   <span className={log.type === 'WARN' ? 'text-amber-500' : 'text-purple-400'}>{log.type}:</span>{' '}
                   <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.msg}</span>
                </div>
              ))}
              <div ref={logEndRef} />
           </div>
           <div className="p-4 bg-slate-950/80 border-t border-slate-900">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">Connected to Cluster-BD01</p>
           </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AdminDashboard;



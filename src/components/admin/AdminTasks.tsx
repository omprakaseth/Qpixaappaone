import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

interface AdminTask {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  assigned_to_email?: string;
}

export default function AdminTasks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { user } = useAppState();
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  
  // New task form
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const fetchTasks = async () => {
    try {
      let query = supabase.from('admin_tasks').select('*').order('created_at', { ascending: false });
      
      // If not super admin, only show tasks assigned to them
      if (!isSuperAdmin && user) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch emails for assigned users
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(t => t.assigned_to))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
          
        const enrichedTasks = data.map(task => ({
          ...task,
          assigned_to_email: profiles?.find(p => p.id === task.assigned_to)?.username || 'Unknown'
        }));
        setTasks(enrichedTasks);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!isSuperAdmin) return;
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (roles && roles.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', roles.map(r => r.user_id));
      if (profiles) setAdmins(profiles.map(p => ({ id: p.id, email: p.username || '' })));
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAdmins();
  }, [isSuperAdmin, user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assigned_to) return toast.error('Title and Assignee are required');
    
    try {
      const { error } = await supabase.from('admin_tasks').insert({
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        assigned_by: user?.id,
        priority: newTask.priority,
        status: 'pending'
      });
      
      if (error) throw error;
      toast.success('Task assigned successfully');
      setShowNewTask(false);
      setNewTask({ title: '', description: '', assigned_to: '', priority: 'medium' });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('admin_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);
        
      if (error) throw error;
      toast.success('Status updated');
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const { error } = await supabase.from('admin_tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast.success('Task deleted');
      fetchTasks();
    } catch (err: any) {
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Tasks & Orders</h2>
          <p className="text-muted-foreground text-sm">
            {isSuperAdmin ? 'Assign and track tasks for your team' : 'View and update your assigned tasks'}
          </p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowNewTask(!showNewTask)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      {showNewTask && isSuperAdmin && (
        <form onSubmit={handleCreateTask} className="bg-card border border-border rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-semibold">Assign New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Task Title</label>
              <input 
                type="text" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g., Review reported posts"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Assign To</label>
              <select 
                value={newTask.assigned_to}
                onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select Employee...</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>{admin.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Description (Optional)</label>
              <textarea 
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                placeholder="Add details or instructions..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select 
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowNewTask(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">Assign Task</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <div className="text-center p-10 bg-card border border-border rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No tasks found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">You're all caught up!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{task.title}</h4>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.description && <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  {isSuperAdmin && (
                    <span className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary font-bold">
                        {task.assigned_to_email?.[0].toUpperCase()}
                      </div>
                      {task.assigned_to_email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={task.status}
                  onChange={(e) => updateStatus(task.id, e.target.value)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    task.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-secondary text-muted-foreground border-border'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                {isSuperAdmin && (
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

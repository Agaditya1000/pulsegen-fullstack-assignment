import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Trash2, Shield, User, Settings as SettingsIcon, Save, AlertTriangle, Check, X, AlertCircle, CheckCircle, Play } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

const AdminPanel = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'settings', 'content'
    const [users, setUsers] = useState([]);
    const [flaggedVideos, setFlaggedVideos] = useState([]);
    const [settings, setSettings] = useState({
        allowRegistration: true,
        maxUploadSizeMB: 50,
        maintenanceMode: false,
        welcomeMessage: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);
    const [previewVideo, setPreviewVideo] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'users' || activeTab === 'dashboard') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, { headers });
                setUsers(res.data);
            }

            if (activeTab === 'settings') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, { headers });
                setSettings(res.data);
            }

            if (activeTab === 'content') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/videos`, { headers });
                setFlaggedVideos(res.data.filter(v => v.status === 'flagged'));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            showNotification('error', 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        editor: users.filter(u => u.role === 'editor').length,
        viewer: users.filter(u => u.role === 'viewer').length
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== id));
            showNotification('success', 'User deleted successfully');
        } catch (error) {
            showNotification('error', 'Failed to delete user');
        }
    };

    const handleRoleUpdate = async (id, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.map(u => u._id === id ? res.data : u));
            showNotification('success', `Role updated to ${newRole}`);
        } catch (error) {
            showNotification('error', 'Failed to update role');
        }
    };

    const handleSettingsSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('success', 'System settings saved');
        } catch (error) {
            showNotification('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReview = async (videoId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this video?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/videos/${videoId}/review`, { action }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFlaggedVideos(flaggedVideos.filter(v => v._id !== videoId));
            showNotification('success', `Video ${action}ed successfully`);
            if (previewVideo?._id === videoId) setPreviewVideo(null);
        } catch (error) {
            showNotification('error', `Failed to ${action} video`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white flex items-center gap-3 animate-in slide-in-from-right duration-300 ${notification.type === 'error' ? 'bg-red-600/90 backdrop-blur border border-red-500' : 'bg-green-600/90 backdrop-blur border border-green-500'
                    }`}>
                    {notification.type === 'error' ? <AlertCircle /> : <CheckCircle />}
                    <p className="font-medium">{notification.message}</p>
                </div>
            )}

            {/* Video Preview Modal */}
            {previewVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewVideo(null)}>
                    <div className="bg-gray-900 border border-gray-700 p-1 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white max-w-2xl truncate flex items-center gap-2">
                                <AlertTriangle className="text-red-500" />
                                Reviewing: {previewVideo.title}
                            </h2>
                            <button onClick={() => setPreviewVideo(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="bg-black">
                            <VideoPlayer videoId={previewVideo._id} />
                        </div>
                        <div className="p-4 bg-gray-800/30 flex justify-end gap-3">
                            <button
                                onClick={() => handleReview(previewVideo._id, 'reject')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <X size={18} /> Reject & Ban
                            </button>
                            <button
                                onClick={() => handleReview(previewVideo._id, 'approve')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Check size={18} /> Approve Content
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-700/50">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        <Shield className="text-blue-500 w-8 h-8" />
                        Admin Console
                    </h2>
                    <p className="text-gray-400 mt-1 ml-11">System management and moderation</p>
                </div>
                <div className="mt-4 md:mt-0 bg-gray-700/50 p-1 rounded-lg flex overflow-x-auto max-w-full">
                    {[
                        { id: 'dashboard', icon: Shield, label: 'Overview' },
                        { id: 'content', icon: AlertTriangle, label: 'Content Review' },
                        { id: 'users', icon: User, label: 'Users' },
                        { id: 'settings', icon: SettingsIcon, label: 'Settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-600'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p>Loading system data...</p>
                </div>
            ) : activeTab === 'dashboard' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-gray-400">Total Users</span>
                            <User className="text-blue-500 p-1.5 bg-blue-500/10 rounded-lg w-8 h-8" />
                        </div>
                        <span className="text-4xl font-bold text-white">{stats.total}</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-gray-400">Administrators</span>
                            <Shield className="text-indigo-500 p-1.5 bg-indigo-500/10 rounded-lg w-8 h-8" />
                        </div>
                        <span className="text-4xl font-bold text-indigo-400">{stats.admin}</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-gray-400">Editors</span>
                            <User className="text-green-500 p-1.5 bg-green-500/10 rounded-lg w-8 h-8" />
                        </div>
                        <span className="text-4xl font-bold text-green-400">{stats.editor}</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-gray-400">Viewers</span>
                            <User className="text-gray-500 p-1.5 bg-gray-500/10 rounded-lg w-8 h-8" />
                        </div>
                        <span className="text-4xl font-bold text-gray-300">{stats.viewer}</span>
                    </div>
                </div>
            ) : activeTab === 'users' ? (
                <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900/50">
                                <tr className="text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">User Profile</th>
                                    <th className="p-4 font-medium">Role Configuration</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-750 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                                                    {u.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{u.username}</div>
                                                    <div className="text-sm text-gray-400">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleUpdate(u._id, e.target.value)}
                                                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors cursor-pointer hover:border-blue-500"
                                                disabled={u._id === user._id}
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(u._id)}
                                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Delete User"
                                                disabled={u._id === user._id}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'settings' ? (
                <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <SettingsIcon className="text-gray-400" />
                        System Configuration
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <div>
                                <h4 className="font-medium">Maintenance Mode</h4>
                                <p className="text-sm text-gray-400">Suspend all non-admin access</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <div>
                                <h4 className="font-medium">Public Registration</h4>
                                <p className="text-sm text-gray-400">Allow new users to sign up</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allowRegistration}
                                    onChange={e => setSettings({ ...settings, allowRegistration: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block mb-2 text-gray-400">Max Upload Size (MB)</label>
                            <input
                                type="number"
                                value={settings.maxUploadSizeMB}
                                onChange={e => setSettings({ ...settings, maxUploadSizeMB: parseInt(e.target.value) })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-gray-400">Welcome Message</label>
                            <input
                                type="text"
                                value={settings.welcomeMessage}
                                onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <button
                                onClick={handleSettingsSave}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 font-medium"
                                disabled={saving}
                            >
                                <Save size={20} /> {saving ? 'Saving...' : 'Save System Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-900/20 to-gray-800 p-6 rounded-2xl border border-red-500/30 flex items-center gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full">
                            <AlertTriangle className="text-red-500 w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Content Moderation Queue</h3>
                            <p className="text-gray-400">Review videos flagged by sensitivity algorithms</p>
                        </div>
                    </div>

                    {flaggedVideos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-800/20">
                            <CheckCircle className="w-16 h-16 mb-4 text-green-500/50" />
                            <p className="text-xl font-medium">All Clear!</p>
                            <p className="text-sm mt-2">No flagged content pending review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {flaggedVideos.map(video => (
                                <div key={video._id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg hover:border-red-500/50 transition-colors">
                                    <div className="p-6 flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                                                        {video.title}
                                                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-wide">High Risk</span>
                                                    </h4>
                                                    <p className="text-sm text-gray-400 flex items-center gap-2">
                                                        <User size={14} /> {video.uploader?.username || 'Unknown User'}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-700/50 px-3 py-1 rounded-lg text-sm font-mono text-gray-300">
                                                    ID: {video._id.slice(-6)}
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Flagging Reasons</span>
                                                    <div className="mt-1 flex flex-wrap gap-2">
                                                        {video.reasons && video.reasons.length > 0 ? (
                                                            video.reasons.map((r, i) => (
                                                                <span key={i} className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded border border-red-900/50">
                                                                    {r}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Manual review required</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Risk Analysis</span>
                                                    <div className="mt-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                                <div className="bg-red-500 h-full" style={{ width: `${(video.riskScore || 0) * 100}%` }}></div>
                                                            </div>
                                                            <span>{(video.riskScore * 100).toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 justify-center min-w-[180px]">
                                            <button
                                                onClick={() => setPreviewVideo(video)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium mb-2"
                                            >
                                                <Play size={18} fill="currentColor" /> Review Content
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReview(video._id, 'approve')}
                                                    className="flex-1 bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors border border-gray-600 hover:border-green-500 flex items-center justify-center gap-1 text-sm"
                                                    title="Approve as Safe"
                                                >
                                                    <Check size={18} /> Safe
                                                </button>
                                                <button
                                                    onClick={() => handleReview(video._id, 'reject')}
                                                    className="flex-1 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors border border-gray-600 hover:border-red-500 flex items-center justify-center gap-1 text-sm"
                                                    title="Reject & Hide"
                                                >
                                                    <X size={18} /> Ban
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import VideoPlayer from '../components/VideoPlayer';
import { Upload, Play, AlertCircle, CheckCircle, Trash2, Edit2, X, Save } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isPublic, setIsPublic] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'safe', 'flagged'
    const [uploadAllowedUsers, setUploadAllowedUsers] = useState([]);

    // Edit Mode State
    const [editingVideo, setEditingVideo] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(false);
    const [editAllowedUsers, setEditAllowedUsers] = useState([]);
    const [editFile, setEditFile] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [notification, setNotification] = useState(null); // { type: 'error' | 'success', message: '' }

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        newSocket.on('video_processed', ({ videoId, status }) => {
            setVideos(prev => prev.map(v => v._id === videoId ? { ...v, status } : v));
        });

        // Initial fetch
        fetchVideos();

        return () => newSocket.close();
    }, [user]);

    const fetchVideos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/videos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideos(res.data);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                logout(); // Token expired or invalid
            }
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/videos/${videoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVideos(videos.filter(v => v._id !== videoId));
            showNotification('success', 'Video deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('error', error.response?.data?.message || 'Failed to delete video');
        }
    };

    const openEditModal = async (video) => {
        setEditingVideo(video);
        setEditTitle(video.title);
        setEditDescription(video.description || '');
        setEditIsPublic(video.isPublic);
        setEditAllowedUsers(video.allowedUsers || []);
        setEditFile(null); // Reset file input

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out self and admins if needed, or just show all
            setAvailableUsers(res.data.filter(u => u._id !== user.id));
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleUpdateSubmit = async () => {
        if (!editTitle) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('description', editDescription);
            formData.append('isPublic', editIsPublic);
            formData.append('allowedUsers', JSON.stringify(editAllowedUsers));

            if (editFile) {
                formData.append('video', editFile);
            }

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/videos/${editingVideo._id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setVideos(videos.map(v => v._id === editingVideo._id ? res.data : v));
            setEditingVideo(null);
            showNotification('success', 'Video updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            showNotification('error', error.response?.data?.message || 'Failed to update video');
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setTitle(file.name.replace(/\.[^/.]+$/, "")); // Default title to filename without extension

            // Proactively fetch users for assignment
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAvailableUsers(res.data.filter(u => u._id !== user.id));
            } catch (error) {
                console.error('Failed to fetch users', error);
            }
        }
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile || !title) return;

        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('isPublic', isPublic);
        formData.append('allowedUsers', JSON.stringify(uploadAllowedUsers));

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/videos/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            setUploadProgress(0);
            setUploading(false);
            // Reset fields
            setSelectedFile(null);
            setTitle("");
            setDescription("");
            setIsPublic(false);
            setUploadAllowedUsers([]);

            showNotification('success', 'Video uploaded successfully! Processing started...');
            fetchVideos(); // Refresh list
        } catch (error) {
            console.error('Upload Error Details:', error);
            setUploading(false);
            const errorMessage = error.response?.data?.message
                || error.message
                || 'Upload failed (Unknown Error)';
            showNotification('error', `Upload Failed: ${errorMessage}`);
        }
    };

    if (!user) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10 animate-pulse delay-1000"></div>

                <div className="max-w-4xl px-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 animate-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        New: Advanced AI Content Analysis 2.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight animate-in slide-in-from-bottom-5 duration-700">
                        <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Secure Video Streaming </span>
                        <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Reimagined</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-6 duration-1000">
                        StreamSure provides enterprise-grade video hosting with real-time AI content moderation.
                        Protect your platform effortlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-105 hover:shadow-blue-500/40 transition-all duration-300 w-full sm:w-auto">
                            Start for Free
                        </Link>
                        <button className="px-8 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center group">
                            <Play className="w-5 h-5 group-hover:text-blue-400 transition-colors" /> Watch Demo
                        </button>
                    </div>
                </div>

                {/* Simulated Dashboard Link */}
                <div className="mt-20 opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-not-allowed hidden md:block z-0 transform perspective-[1000px] rotate-x-12 scale-90">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl w-[800px] h-[400px] relative overflow-hidden group">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        <div className="flex gap-4 mb-4">
                            <div className="w-64 h-32 bg-gray-800 rounded-lg animate-pulse"></div>
                            <div className="w-64 h-32 bg-gray-800 rounded-lg animate-pulse delay-75"></div>
                            <div className="w-64 h-32 bg-gray-800 rounded-lg animate-pulse delay-150"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-bold text-2xl text-white backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                            Live Dashboard Preview
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white flex items-center gap-3 animate-in slide-in-from-right duration-300 ${notification.type === 'error' ? 'bg-red-600/90 backdrop-blur border border-red-500' : 'bg-green-600/90 backdrop-blur border border-green-500'
                    }`}>
                    {notification.type === 'error' ? <AlertCircle /> : <CheckCircle />}
                    <p className="font-medium">{notification.message}</p>
                </div>
            )}

            {/* Video Player Modal Overlay */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedVideo(null)}>
                    <div className="bg-gray-900 border border-gray-700 p-1 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white max-w-2xl truncate flex items-center gap-2">
                                <Play className="w-5 h-5 text-blue-400" />
                                {selectedVideo.title}
                            </h2>
                            <button onClick={() => setSelectedVideo(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="bg-black">
                            <VideoPlayer videoId={selectedVideo._id} />
                        </div>
                        <div className="p-4 bg-gray-800/30">
                            <p className="text-gray-300 text-sm">{selectedVideo.description || "No description provided."}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Video Modal */}
            {editingVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEditingVideo(null)}>
                    <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit2 size={20} className="text-blue-400" /> Edit Video
                            </h3>
                            <button onClick={() => setEditingVideo(null)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Replace Video File (Optional)</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setEditFile(e.target.files[0])}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white h-24 resize-none focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={editIsPublic}
                                    onChange={(e) => setEditIsPublic(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-offset-0 focus:ring-0 bg-gray-700"
                                />
                                <span className="text-gray-300">Publically Visible</span>
                            </label>

                            {!editIsPublic && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-400">Grant Access to Users:</label>
                                    <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 max-h-32 overflow-y-auto">
                                        {availableUsers.length > 0 ? availableUsers.map(u => (
                                            <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editAllowedUsers.includes(u._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setEditAllowedUsers([...editAllowedUsers, u._id]);
                                                        } else {
                                                            setEditAllowedUsers(editAllowedUsers.filter(id => id !== u._id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-0 bg-gray-700"
                                                />
                                                <span className="text-gray-300 text-sm">{u.username} ({u.role})</span>
                                            </label>
                                        )) : (
                                            <p className="text-gray-500 text-sm p-2">No other users found.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setEditingVideo(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                            <button onClick={handleUpdateSubmit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}



            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-700/50">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Video Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Manage, watch, and analyze your content</p>
                </div>
                {(user.role === 'admin' || user.role === 'editor') && (
                    <div className="w-full md:w-auto bg-gray-700/50 p-4 rounded-xl border border-gray-600/30 backdrop-blur-sm">
                        {!selectedFile ? (
                            <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-900/20 w-full md:w-auto font-medium">
                                <Upload size={20} />
                                Upload New Video
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        ) : (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300 min-w-[300px]">
                                <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                                    <h3 className="font-semibold text-blue-300">New Upload</h3>
                                    <button onClick={() => setSelectedFile(null)} className="text-xs text-gray-400 hover:text-white uppercase tracking-wider">Cancel</button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-all"
                                />

                                <textarea
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none h-20 transition-all resize-none"
                                />

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={isPublic}
                                                onChange={(e) => setIsPublic(e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                        <span className="text-sm font-medium group-hover:text-white transition-colors">Public</span>
                                        <span className="text-sm font-medium group-hover:text-white transition-colors">Public</span>
                                    </label>

                                    {!isPublic && (
                                        <div className="absolute bottom-full mb-2 left-0 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-2 hidden group-hover:block hover:block">
                                            <p className="text-xs text-gray-400 mb-2 font-medium">Assign Private Access:</p>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {availableUsers.map(u => (
                                                    <label key={u._id} className="flex items-center gap-2 p-1 hover:bg-gray-700/50 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={uploadAllowedUsers.includes(u._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setUploadAllowedUsers([...uploadAllowedUsers, u._id]);
                                                                } else {
                                                                    setUploadAllowedUsers(uploadAllowedUsers.filter(id => id !== u._id));
                                                                }
                                                            }}
                                                            className="rounded border-gray-600 bg-gray-700 text-blue-500 w-3 h-3 focus:ring-0"
                                                        />
                                                        <span className="text-xs text-gray-300 truncate">{u.username}</span>
                                                    </label>
                                                ))}
                                                {availableUsers.length === 0 && <span className="text-xs text-gray-500">No users found</span>}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleUploadSubmit}
                                        disabled={uploading || !title}
                                        className={`flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg transition-all shadow-lg ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>{uploadProgress}%</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                <span>Upload</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-4 z-30">
                <input
                    type="text"
                    placeholder="Search your library..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800/80 backdrop-blur border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full shadow-lg"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800/80 backdrop-blur border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-lg min-w-[150px]"
                >
                    <option value="all">All Status</option>
                    <option value="safe">Safe Only</option>
                    <option value="flagged">Flagged</option>
                    <option value="processing">Processing</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.filter(video => {
                    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
                    return matchesSearch && matchesStatus;
                }).map((video) => (
                    <div key={video._id} className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 hover:border-blue-500/50 transition-all hover:shadow-blue-500/10 hover:-translate-y-1">
                        <div className="h-48 bg-gray-900 flex items-center justify-center relative cursor-pointer overflow-hidden" onClick={() => video.status === 'safe' && setSelectedVideo(video)}>
                            {/* Decorative gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />

                            {video.status === 'safe' ? (
                                <>
                                    {/* Abstract thumbnail placeholder using CSS pattern if no image */}
                                    <div className="absolute inset-0 bg-gray-800 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                                    <Play className="w-16 h-16 text-white/80 group-hover:text-blue-400 group-hover:scale-110 transition-all z-10 drop-shadow-lg" />
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500 z-10">
                                    <AlertCircle className={`mb-3 w-12 h-12 ${video.status === 'flagged' ? 'text-red-500' : 'text-yellow-500 animate-pulse'}`} />
                                    <span className="font-medium tracking-wide bg-gray-900/80 px-3 py-1 rounded-full text-xs uppercase">
                                        {video.status === 'processing' ? 'Analysis in Progress' : 'Content Flagged'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-lg truncate text-gray-100 group-hover:text-blue-400 transition-colors" title={video.title}>{video.title}</h3>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                    {video.uploader?.username || 'Unknown'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {(user.role === 'admin' || (user.role === 'editor' && video.uploader?._id === user.id)) && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(video); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteVideo(video._id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border 
                                        ${video.status === 'safe' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            video.status === 'flagged' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                        {video.status === 'safe' && <CheckCircle size={12} />}
                                        {video.status === 'flagged' && <AlertCircle size={12} />}
                                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {videos.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl bg-gray-800/30">
                        <Upload className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-xl font-medium">No videos found</p>
                        <p className="text-sm mt-2">Upload a video to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

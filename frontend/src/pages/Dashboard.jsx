import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import VideoPlayer from '../components/VideoPlayer';
import { Upload, Play, AlertCircle, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
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
            const res = await axios.get('http://localhost:5000/api/videos', {
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

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', file.name);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/videos/upload', formData, {
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
            fetchVideos(); // Refresh list to see "processing" video
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Upload failed');
        }
    };

    if (!user) {
        return <div className="text-center mt-10 text-gray-400">Please login to view dashboard.</div>;
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-md">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Video Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Manage and watch your streams</p>
                </div>
                {(user.role === 'admin' || user.role === 'editor') && (
                    <div className="relative">
                        <label className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload size={20} />
                            {uploading ? `Uploading ${uploadProgress}%` : 'Upload Video'}
                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                )}
            </header>

            {selectedVideo && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Now Playing: <span className="text-blue-400">{selectedVideo.title}</span></h2>
                        <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white">Close</button>
                    </div>
                    <VideoPlayer videoId={selectedVideo._id} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <div key={video._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="h-40 bg-gray-900 flex items-center justify-center relative group cursor-pointer" onClick={() => video.status === 'safe' && setSelectedVideo(video)}>
                            {video.status === 'safe' ? (
                                <>
                                    <VideoPlayer videoId={video._id} /> {/* Preview or Thumbnail ideally */}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-12 h-12 text-white" />
                                    </div>
                                    {/* Overlay for not playing just thumbnail behavior - using simple placeholder or video tag muted */}
                                    <div className="absolute inset-0 bg-gray-900 z-10 flex items-center justify-center">
                                        <Play className="w-12 h-12 text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <AlertCircle className="mb-2" />
                                    <span>{video.status === 'processing' ? 'Processing...' : 'Content Flagged'}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg truncate" title={video.title}>{video.title}</h3>
                            <div className="flex items-center justify-between mt-2 text-sm">
                                <span className="text-gray-400">By {video.uploader?.username || 'Unknown'}</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium 
                                    ${video.status === 'safe' ? 'bg-green-500/10 text-green-500' :
                                        video.status === 'flagged' ? 'bg-red-500/10 text-red-500' :
                                            'bg-yellow-500/10 text-yellow-500'}`}>
                                    {video.status === 'safe' && <CheckCircle size={12} />}
                                    {video.status === 'flagged' && <AlertCircle size={12} />}
                                    {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {videos.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No videos found. Upload one to get started!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

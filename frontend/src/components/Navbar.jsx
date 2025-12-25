import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogOut, Video } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="container mx-auto px-4 flex justify-between items-center h-16">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-400 hover:text-blue-300">
                    <Video className="w-8 h-8" />
                    StreamSure
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-gray-300">Welcome, {user.username} ({user.role})</span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                                title="Logout"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
                            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

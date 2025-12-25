import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogOut, Video, Shield, Menu, X, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg py-2' : 'bg-transparent py-4'
            }`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Video className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-display tracking-tight hover:from-blue-400 hover:to-indigo-400 transition-all duration-300">
                        StreamSure
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <>
                            <div className="flex items-center gap-4 mr-4">
                                {user.role === 'admin' && (
                                    <Link to="/admin"
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${isActive('/admin')
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                            }`}
                                    >
                                        <Shield size={16} />
                                        <span className="font-medium">Admin Dashboard</span>
                                    </Link>
                                )}
                            </div>

                            <div className="h-8 w-[1px] bg-gray-700 mx-2"></div>

                            <div className="flex items-center gap-3 pl-2">
                                <div className="text-right hidden lg:block">
                                    <p className="text-sm font-medium text-white">{user.username}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-sm font-bold text-gray-300 shadow-inner">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="group ml-2 p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 relative overflow-hidden"
                                title="Logout"
                            >
                                <LogOut size={20} className="relative z-10 transition-transform group-hover:-translate-x-0.5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors px-4 py-2 hover:bg-white/5 rounded-lg">
                                Login
                            </Link>
                            <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 border border-blue-500/20">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-300 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-gray-900 border-b border-gray-800 p-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
                    <div className="flex flex-col gap-4">
                        {user ? (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                        {user.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user.username}</p>
                                        <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                                    </div>
                                </div>

                                {user.role === 'admin' && (
                                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-3 text-gray-300 hover:bg-gray-800 rounded-lg">
                                        <Shield size={18} /> Admin Dashboard
                                    </Link>
                                )}

                                <button onClick={handleLogout} className="flex items-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-lg w-full text-left">
                                    <LogOut size={18} /> Logout
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center p-3 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

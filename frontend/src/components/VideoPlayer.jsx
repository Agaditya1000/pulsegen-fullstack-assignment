import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoId, token }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            // If we needed custom headers for auth, we'd need to fetch blob or use service worker.
            // For now, using query param token if needed or just direct URL.
            // videoRef.current.src = `http://localhost:5000/api/videos/stream/${videoId}?token=${token}`;
        }
    }, [videoId, token]);

    return (
        <div className="w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl">
            <video
                ref={videoRef}
                controls
                width="100%"
                height="auto"
                className="w-full h-auto"
                src={`http://localhost:5000/api/videos/stream/${videoId}`} // Simplified for demo
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;

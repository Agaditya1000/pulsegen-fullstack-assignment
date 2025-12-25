import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoId }) => {
    const videoRef = useRef(null);
    const token = localStorage.getItem('token');

    // ...

    return (
        <div className="w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl">
            <video
                ref={videoRef}
                controls
                width="100%"
                height="auto"
                className="w-full h-auto"
                src={`http://localhost:5000/api/videos/stream/${videoId}?token=${token}`}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBot.css';
import logo from './logo.png'; // Replace with your logo image path

function ChatBot() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [image, setImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        setIsTyping(true);

        const res = await axios.post('http://localhost:5000/chat', { message });
        setResponse(res.data.response);
        setMessage(''); // Clear input after submit

        setIsTyping(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        setImage(file);

        const formData = new FormData();
        formData.append('image', file);

        const res = await axios.post('http://localhost:5000/chat', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResponse(res.data.response);
        setImage(null); // Clear image input after upload
    };

    const handleClearChat = () => {
        setResponse('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [response]);

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <img src={logo} alt="ChatBot Logo" />
                <h2>ChatBot with BERT and YOLO Integration</h2>
            </div>
            <div className="chatbot-content">
                <div className="chatbot-messages">
                    {response && <div className="chatbot-message bot"><p>{response}</p></div>}
                    {isTyping && 
                        <div className="typing-indicator">
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    }
                    <div ref={messagesEndRef} />
                </div>
                <form className="chatbot-form" onSubmit={handleTextSubmit}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="chatbot-input"
                    />
                    <button type="submit" className="chatbot-button">Send</button>
                    <button type="button" className="chatbot-clear-button" onClick={handleClearChat}>Clear</button>
                </form>
                <input
                    type="file"
                    onChange={handleImageUpload}
                    className="chatbot-file-input"
                />
            </div>
        </div>
    );
}

export default ChatBot;

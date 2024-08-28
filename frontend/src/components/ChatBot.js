import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBot.css';
import logo from './logo.png'; // Replace with your logo image path

function ChatBot() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [image, setImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        addMessage({ text: message, sender: 'user' });
        setIsTyping(true);
        setMessage('');

        try {
            const res = await axios.post('http://localhost:5000/chat', { message });
            addMessage({ text: res.data.response, sender: 'bot' });
        } catch (err) {
            setError('Failed to get response from the server.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        addMessage({ text: 'Image uploaded', sender: 'user', image: URL.createObjectURL(file) });

        const formData = new FormData();
        formData.append('image', file);

        try {
            setIsTyping(true);
            const res = await axios.post('http://localhost:5000/chat', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            addMessage({ text: res.data.response, sender: 'bot' });
        } catch (err) {
            setError('Failed to get response from the server.');
        } finally {
            setIsTyping(false);
            setImage(null); // Clear image input after upload
        }
    };

    const addMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleClearChat = () => {
        setMessages([]);
        setError(null);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chatbot-container">
            <div className="chatbot-header">
                <img src={logo} alt="ChatBot Logo" />
                <h2>ChatBot with BERT and YOLO Integration</h2>
            </div>
            <div className="chatbot-content">
                <div className="chatbot-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chatbot-message ${msg.sender}`}>
                            {msg.image && <img src={msg.image} alt="Uploaded" className="chatbot-image-preview" />}
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="typing-indicator">
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    )}
                    {error && <div className="chatbot-error">{error}</div>}
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
                    accept="image/*"
                />
            </div>
        </div>
    );
}

export default ChatBot;

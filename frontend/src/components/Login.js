import React, { useState } from 'react';
import { auth, signInWithPopup, provider, signInWithEmailAndPassword } from '../firebase-config';
import './Login.css';

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleLoginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
            onLogin();
        } catch (error) {
            console.error("Error during Google sign in: ", error);
        }
    };

    const handleLoginWithEmail = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLogin();
        } catch (error) {
            setError(error.message);
            console.error("Error during email sign in: ", error);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to ChatBot</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button onClick={handleLoginWithEmail} className="login-button">
                Login
            </button>
            <button onClick={handleLoginWithGoogle} className="login-button">
                Sign in with Google
            </button>
            <p onClick={onSwitchToRegister} className="switch-text">
                Don't have an account? Register here.
            </p>
        </div>
    );
}

export default Login;

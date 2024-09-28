import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, db } from '../firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import './Register.css';

function Register({ onRegisterSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleRegister = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user details in Firestore
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email
            });

            onRegisterSuccess(); // Notify parent component to show the login page
        } catch (error) {
            setError(error.message);
            console.error("Error during registration: ", error);
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
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
            <button onClick={handleRegister} className="register-button">
                Register
            </button>
        </div>
    );
}

export default Register;

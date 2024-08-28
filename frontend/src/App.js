// src/App.js
import React from 'react';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the AI ChatBot</h1>
      </header>
      <main>
        <ChatBot />
      </main>
    </div>
  );
}

export default App;
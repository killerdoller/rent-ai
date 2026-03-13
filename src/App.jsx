import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import { Root } from './flow/components/Root';
import { Onboarding } from './flow/components/Onboarding';
import { Home } from './flow/components/Home';
import { Matches } from './flow/components/Matches';
import { Favorites } from './flow/components/Favorites';
import { Chat } from './flow/components/Chat';
import { Profile } from './flow/components/Profile';
import { ChatRoom } from './flow/components/ChatRoom';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* User Flow Application */}
        <Route path="/app" element={<Root />}>
          <Route index element={<Onboarding />} />
          <Route path="home" element={<Home />} />
          <Route path="matches" element={<Matches />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<ChatRoom />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

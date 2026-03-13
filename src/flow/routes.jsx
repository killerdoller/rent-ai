import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Onboarding } from "./components/Onboarding";
import { Home } from "./components/Home";
import { Matches } from "./components/Matches";
import { Favorites } from "./components/Favorites";
import { Chat } from "./components/Chat";
import { Profile } from "./components/Profile";
import { ChatRoom } from "./components/ChatRoom";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Onboarding },
      { path: "home", Component: Home },
      { path: "matches", Component: Matches },
      { path: "favorites", Component: Favorites },
      { path: "chat", Component: Chat },
      { path: "chat/:id", Component: ChatRoom },
      { path: "profile", Component: Profile },
    ],
  },
]);

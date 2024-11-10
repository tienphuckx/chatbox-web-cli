import { createApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import RegisterPage from "./views/RegisterPage.vue";
import ChatRoom from "./components/ChatRoom.vue";
import "./assets/tailwind.css";

const routes = [
  { path: "/", component: RegisterPage },
  { path: "/chatroom", component: ChatRoom },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount("#app");

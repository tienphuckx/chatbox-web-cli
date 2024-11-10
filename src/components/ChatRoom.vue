<template>
    <div class="chatroom-container flex h-screen">
      <!-- Left Panel: Group List -->
      <div class="bg-gray-100 w-1/4 p-4 border-r">
        <!-- Display User Info -->
        <div class="mb-4">
          <h2 class="text-xl font-bold">Welcome, {{ user.username }}</h2>
          <p class="text-gray-600">User ID: {{ user.id }}</p>
        </div>
  
        <!-- Search Bar -->
        <input
          v-model="searchQuery"
          placeholder="Search groups..."
          class="border p-2 w-full mb-4"
        />
  
        <!-- Group List -->
        <div>
          <ul v-if="filteredGroups.length > 0" class="mb-4">
            <li
              v-for="group in filteredGroups"
              :key="group.id"
              class="cursor-pointer p-2 rounded hover:bg-gray-200"
              :class="{ 'bg-blue-100': group.id === currentGroupId }"
              @click="selectGroup(group.id)"
            >
              {{ group.name }}
            </li>
          </ul>
          <p v-else>No groups found. Join a group using a group code or create a new group.</p>
        </div>
  
        <!-- Create Group Card -->
        <div class="p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white mt-auto">
          <h3 class="text-lg font-bold mb-2">Create a New Group</h3>
          <input
            v-model="newGroupName"
            placeholder="Enter group name"
            class="border p-2 w-full mb-2 text-black"
          />
          <div class="flex items-center mb-2">
            <input type="checkbox" v-model="approvalRequire" class="mr-2" />
            <label for="approvalRequire">Approval Required</label>
          </div>
          <select v-model="selectedDuration" class="border p-2 w-full mb-2">
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="180">3 hours</option>
            <option value="1440">24 hours</option>
          </select>
          <input
            v-model="maximumMembers"
            type="number"
            min="1"
            placeholder="Enter maximum members"
            class="border p-2 w-full mb-2 text-black"
          />
          <button
            @click="createGroup"
            class="bg-white text-blue-500 px-4 py-2 rounded w-full font-semibold hover:bg-gray-100"
          >
            Create Group
          </button>
        </div>
      </div>
  
      <!-- Right Panel: Messages -->
      <div class="flex-grow p-4">
        <div v-if="!currentGroupId">
          <p>Select a group to view messages.</p>
        </div>
        <div v-else>
          <h2 class="text-xl font-bold mb-4">
            Messages in Group: {{ currentGroupName }}
          </h2>
          <div class="messages border rounded p-4 h-64 overflow-y-scroll mb-4">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message mb-2"
            >
              <strong>{{ message.senderId }}:</strong> {{ message.content }}
            </div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newMessage"
              placeholder="Enter your message"
              class="border rounded p-2 flex-grow"
            />
            <button
              @click="sendMessage"
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        user: JSON.parse(localStorage.getItem("x-user")) || {}, // Retrieve user info
        groups: [],
        filteredGroups: [],
        currentGroupId: null,
        currentGroupName: "",
        messages: [],
        newMessage: "",
        newGroupName: "",
        groupCode: "", // Input for group code
        approvalRequire: false, // Checkbox for approval requirement
        selectedDuration: 30, // Duration in minutes
        maximumMembers: null, // Maximum members
        searchQuery: "",
        ws: null, // WebSocket instance
        durationMap: {
          30: 30 * 60, // 30 minutes
          60: 60 * 60, // 1 hour
          180: 180 * 60, // 3 hours
          1440: 1440 * 60, // 24 hours
        },
      };
    },
    created() {
      this.fetchGroups();
    },
    methods: {
      async fetchGroups() {
      try {
        const response = await axios.get(`http://localhost:8082/api/groups/user/${this.user.id}`);
        this.groups = response.data;
        console.log("Fetched groups:", this.groups);
      } catch (error) {
        console.error("Error fetching groups:", error.response?.data || error.message);
        alert("Failed to fetch groups. Please try again.");
      }
    },
      async createGroup() {
        if (!this.newGroupName || !this.maximumMembers) {
          alert("Group name and maximum members cannot be empty!");
          return;
        }
  
        const remainSeconds = this.durationMap[this.selectedDuration];
  
        try {
          const response = await axios.post("http://localhost:8082/api/groups/add", {
            groupName: this.newGroupName,
            userId: this.user.id,
            approvalRequire: this.approvalRequire,
            remainSeconds,
            maximumMembers: this.maximumMembers,
          });
  
          console.log("Group created successfully:", response.data);
          this.newGroupName = "";
          this.approvalRequire = false;
          this.selectedDuration = 30;
          this.maximumMembers = null;
          this.fetchGroups();
          console.log("TODO: fetch group.");

        } catch (error) {
          console.error("Error creating group:", error.response?.data || error.message);
          alert("Failed to create group. Please try again.");
        }
      },
    },
  };
  </script>
  
  <style>
  /* Add TailwindCSS styles for the gradient card */
  </style>
  
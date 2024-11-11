<template>
    <div class="chatroom-container flex h-screen">
      <!-- Left Panel: Group List -->
      <div class="bg-gray-100 w-1/4 p-4 border-r">
        <!-- Display User Info -->
        <div class="mb-4">
          <h2 class="text-xl font-bold">Welcome, {{ user.username }}</h2>
          <!-- <p class="text-gray-600">User ID: {{ user.id }}</p> -->
        </div>
  
        <!-- Search Bar -->
        <input
          v-model="searchQuery"
          placeholder="Search groups..."
          class="border p-2 w-full mb-4"
        />
  
       <!-- Group List -->
        <div>
          <ul v-if="groups.length > 0" class="mb-4 space-y-2">
            <li
              v-for="group in groups"
              :key="group.id"
              class="flex items-center justify-between p-4 rounded shadow hover:bg-gray-100"
              :class="[
                group.id === currentGroupId ? 'bg-blue-200' : 'hover:bg-blue-50'
              ]"
              @click="selectGroup(group.id)"
            >
              <!-- Avatar -->
              <div class="flex items-center">
                <img
                  src="@/assets/logo.png"
                  alt="Group Avatar"
                  class="w-12 h-12 rounded-full mr-4"
                />
                <!-- Group Info -->
                <div class="flex flex-col">
                  <p class="font-semibold text-lg text-left">{{ group.name }}</p>
                  <div class="flex items-center space-x-2">
                    <p class="text-gray-500 text-sm">{{ group.groupCode }}</p>
                    <button
                      class="bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded hover:bg-gray-400"
                      @click.stop="copyGroupCode(group.groupCode)"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="text-gray-500">No groups found. Join a group using a group code or create a new group.</p>
        </div>



        <!-- Create Group Card -->
        <div class="p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white mt-auto">
          <h3 class="text-lg font-bold mb-2">Create a New Group</h3>
          <input
            v-model="newGroupName"
            placeholder="Enter group name"
            class="border p-2 w-full mb-2 text-black"
          />
          
          <select v-model="selectedDuration" class="border p-2 w-full mb-2 bg-transparent">
            <option class="bg-black text-white" value="30">30 minutes</option>
            <option class="bg-black text-white" value="60">1 hour</option>
            <option class="bg-black text-white" value="180">3 hours</option>
            <option class="bg-black text-white" value="1440">24 hours</option>
          </select>

          <div class="flex items-center mb-2">
            <input type="checkbox" v-model="approvalRequire" class="mr-2" />
            <label for="approvalRequire">Approval Required</label>
          </div>
          <button
            @click="createGroup"
            class="bg-white text-blue-500 px-4 py-2 rounded w-full font-semibold hover:bg-gray-100"
          >
            Create Group
          </button>
        </div>

        <!-- Join Group Card -->
        <div class="mt-3 p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white">
          <h3 class="text-lg font-bold mb-2">Join group</h3>
          <input
            v-model="joinGroupCode"
            placeholder="Enter group code"
            class="border p-2 w-full mb-2 text-black"
          />
          <button
            @click="joinGroup"
            class="bg-white text-blue-500 px-4 py-2 rounded w-full font-semibold hover:bg-gray-100"
          >
            Join
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
              v-for="message in currentGroupMessages"
              :key="message.id"
              class="message mb-2"
            >
              <div class="flex justify-between items-center">
                <strong>{{ message.userId }}</strong>
                <span class="text-gray-500 text-xs">
                  {{ new Date(message.createdAt).toLocaleString() }}
                </span>
              </div>
              <p>{{ message.content }}</p>
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

    <!-- Toast Notification -->
    <div
      v-if="showToast"
      class="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade"
    >
      {{ toastMessage }}
    </div>

  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        toastMessage: '',
        showToast: false,
        user: JSON.parse(localStorage.getItem("x-user")) || {}, // Retrieve user info
        groups: [],
        filteredGroups: [],
        currentGroupId: null,
        currentGroupName: "",
        currentGroupCode: "",
        joinGroupCode: "",
        messages: [], // save message 
        newMessage: "", // new message from input
        newGroupName: "",
        groupCode: "", // Input for group code
        approvalRequire: false, // Checkbox for approval requirement
        selectedDuration: 30, // Duration in minutes
        maximumMembers: 200, // Maximum members
        searchQuery: "",
        webSocket: null, // WebSocket connection
        durationMap: {
          30: 30 * 60, // 30 minutes
          60: 60 * 60, // 1 hour
          180: 180 * 60, // 3 hours
          1440: 1440 * 60, // 24 hours
        },
      };
    },
    created() {
      this.connectToWebSocket();
      this.fetchGroups();
    },
    computed: {
      currentGroupMessages() {
        return this.messages.filter(msg => msg.groupId === this.currentGroupId);
      }
    },
    methods: {
      copyGroupCode(groupCode) {
        navigator.clipboard.writeText(groupCode).then(
          () => {
            this.showToastWithMessage("Group code copied!");
          },
          (err) => {
            console.error("Failed to copy text: ", err);
            this.showToastWithMessage("Failed to copy group code.");
          }
        );
      },

      showToastWithMessage(message) {
        this.toastMessage = message;
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
        }, 1000); // Ẩn sau 1 giây
      },

      async selectGroup(groupId) {
        this.currentGroupId = groupId;
        this.currentGroupName = this.groups.find(group => group.id === groupId)?.name || '';

        // Fetch previous messages
        try {
          const response = await axios.get(`http://localhost:8082/api/messages/group/${groupId}`);
          this.messages = response.data;
        } catch (error) {
          console.error("Failed to fetch messages:", error.response?.data || error.message);
        }
      },

      connectToWebSocket() {
        if (this.webSocket) {
          this.webSocket.close();
        }

        this.webSocket = new WebSocket(`ws://localhost:8082/ws/chat`);

        this.webSocket.onopen = () => {
          console.log('WebSocket connection established');
        };

        this.webSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);
            if (message.groupId === this.currentGroupId) {
              this.messages.push(message);
            }
          } catch (error) {
            console.error("Failed to process WebSocket message:", error);
          }
        };

        this.webSocket.onclose = () => {
          console.log('WebSocket connection closed');
        };

        this.webSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      },

      sendMessage() {
        if (this.newMessage.trim() === '') return;

        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
          const userId = JSON.parse(localStorage.getItem("x-user")).id;

          const message = {
            userId,
            groupId: this.currentGroupId,
            content: this.newMessage,
          };

          console.log(message);
          this.webSocket.send(JSON.stringify(message));
          this.newMessage = '';
        } else {
          alert('WebSocket connection is not open.');
        }
      },

      async fetchGroups() {
        try {
          const response = await axios.get(`http://localhost:8082/api/groups/user/${this.user.id}`);
          this.groups = response.data.map(group => ({
            ...group,
          }));
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
      async joinGroup() {
        if (!this.joinGroupCode) {
          alert("Group code cannot be empty!");
          return;
        }
        console.log("Join gr code: ", this.joinGroupCode);

        try {
          const response = await axios.post("http://localhost:8082/api/groups/join", {
            groupCode: this.joinGroupCode,
            userId: this.user.id,
          });

          console.log(response.data);

          if (response.data.success) {
            alert(response.data.message); // Show success message
            this.fetchGroups(); // Refresh groups
          } else {
            alert(response.data.message); // Show error message
          }
        } catch (error) {
          console.error("Error joining group:", error.response?.data || error.message);
          alert("Failed to join group. Please try again.");
        }
      }

    },
  };
  </script>
  
  <style scoped>

  /* Toast Notification */
  @keyframes fade {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  20% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
}

.animate-fade {
  animation: fade 1s ease-in-out;
}
  /* group side bar */

  .hover:bg-gray-200:hover {
    background-color: #e5e7eb; /* Màu xám nhạt */
  }
  .bg-blue-100 {
    background-color: #ebf8ff; /* Màu xanh nhạt */
  }
  .rounded-full {
    border-radius: 9999px; /* Hình tròn */
  }
  </style>
  
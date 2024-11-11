<template>
  <div class="chatroom-container flex h-screen">
    <!-- Left Panel: Group List -->
    <div class="bg-gray-100 w-1/4 p-4 border-r flex flex-col">
      <!-- Display User Info -->
      <div class="mb-4">
        <h2 class="text-xl font-bold text-blue-600">Welcome, {{ user.username }}</h2>
      </div>

      <!-- Search Bar -->
      <input
        v-model="searchQuery"
        placeholder="Search groups..."
        class="border p-2 w-full mb-4 rounded-lg"
      />

      <!-- Group List -->
      <div class="flex-grow overflow-y-auto">
        <ul v-if="groups.length > 0" class="space-y-3">
          <li
            v-for="group in groups"
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
            :class="group.id === currentGroupId ? 'bg-blue-200' : 'bg-white hover:bg-blue-50'"
            @click="selectGroup(group.id)"
          >
            <!-- Avatar -->
            <div class="flex items-center">
              <img
                :src="`https://ui-avatars.com/api/?name=${group.name}`"
                alt="Group Avatar"
                class="w-12 h-12 rounded-full mr-4"
              />
              <!-- Group Info -->
              <div>
                <p class="font-semibold text-lg text-left">{{ group.name }}</p>
                <p class="text-gray-500 text-sm">
                  <span>{{ group.groupCode }}</span>
                  <button
                      class="ml-5 bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded hover:bg-gray-400"
                      @click.stop="copyGroupCode(group.groupCode)"
                    >
                      Copy
                    </button>
                 </p>
                
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-gray-500 text-center">No groups found. Join or create a new group.</p>
      </div>

      <!-- Create Group Card -->
      <div class="p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white mt-4">
        <h3 class="text-lg font-bold mb-2">Create a New Group</h3>
        <input
          v-model="newGroupName"
          placeholder="Enter group name"
          class="border p-2 w-full mb-2 text-black rounded-lg"
        />
        <select v-model="selectedDuration" class="border p-2 w-full mb-2 bg-transparent rounded-lg">
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="180">3 hours</option>
          <option value="1440">24 hours</option>
        </select>
        <div class="flex items-center mb-2">
          <input type="checkbox" v-model="approvalRequire" class="mr-2" />
          <label>Approval Required</label>
        </div>
        <button
          @click="createGroup"
          class="bg-white text-blue-500 px-4 py-2 rounded-lg w-full font-semibold hover:bg-gray-100 transition"
        >
          Create Group
        </button>
      </div>

      <!-- Join Group Card -->
      <div class="p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white mt-4">
        <h3 class="text-lg font-bold mb-2">Join Group</h3>
        <input
          v-model="joinGroupCode"
          placeholder="Enter group code"
          class="border p-2 w-full mb-2 text-black rounded-lg"
        />
        <button
          @click="joinGroup"
          class="bg-white text-blue-500 px-4 py-2 rounded-lg w-full font-semibold hover:bg-gray-100 transition"
        >
          Join
        </button>
      </div>
    </div>

    <!-- Right Panel: Messages -->
    <div class="flex-grow p-4 flex flex-col h-screen">
      <div v-if="!currentGroupId" class="flex items-center justify-center flex-grow">
        <p class="text-gray-500 text-lg">Select a group to view messages.</p>
      </div>
      <div v-else class="flex flex-col h-full">
        <!-- Header -->
        <h2 class="text-xl font-bold mb-4 text-blue-600">Group: {{ currentGroupName }}</h2>

        <!-- List Messages -->
        <div
          ref="messagesContainer"
          class="messages flex-grow border rounded-lg p-4 overflow-y-auto bg-gray-50"
        >
          <div
            v-for="message in currentGroupMessages"
            :key="message.id"
            class="flex mb-4"
            :class="message.userId === user.id ? 'justify-end' : 'justify-start'"
          >
            <div
              class="flex items-start space-x-4"
              :class="message.userId === user.id ? 'flex-row-reverse' : ''"
            >
              <img
                :src="`https://ui-avatars.com/api/?name=${message.userId}`"
                alt="Avatar"
                class="w-10 h-10 rounded-full"
              />
              <div class="text-sm max-w-md">
                <p
                  class="p-2 rounded-lg"
                  :class="message.userId === user.id ? 'bg-blue-500 text-white text-right' : 'bg-gray-200 text-left'"
                >
                  {{ message.content }}
                </p>
                <span class="text-gray-500 text-xs block mt-1" :class="message.userId === user.id ? 'text-right' : ''">
                  {{ new Date(message.createdAt).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>
        </div>


        <!-- Input New Message -->
        <div class="mt-4 flex gap-2">
          <input
            v-model="newMessage"
            placeholder="Enter your message"
            class="border rounded-lg p-2 flex-grow"
            @keydown.enter="sendMessage"
          />
          <button
            @click="sendMessage"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
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
    class="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade"
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
    watch: {
        currentGroupMessages() {
          // Scroll xuống cuối khi nhận tin nhắn mới
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        },
      },
    methods: {

      scrollToBottom() {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight; // Cuộn xuống cuối
        }
      },

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
          
          this.$nextTick(() => {
          this.scrollToBottom();
      });
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

  /* Toast Animation */
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

/* General Styles */
.hover\:bg-gray-200:hover {
  background-color: #e5e7eb;
}

.bg-blue-100 {
  background-color: #ebf8ff;
}

.rounded-full {
  border-radius: 9999px;
}

.transition {
  transition: all 0.3s ease-in-out;
}
/* List Messages */
.messages {
  max-height: calc(100% - 56px); /* Tính toán trừ khoảng trống cho header và footer nếu cần */
}

  </style>
  
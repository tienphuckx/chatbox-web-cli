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
      <div
       class="flex-grow overflow-y-auto">
        <ul v-if="groups.length > 0" class="space-y-3">
          <li
            v-for="group in groups"
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
            :class="[
              group.id === currentGroupId ? 'bg-blue-200' : 'bg-white hover:bg-blue-50',
              group.status === 'joined' ? '' : 'cursor-not-allowed opacity-50'
            ]"
            @click="group.status === 'joined' ? selectGroup(group.id) : null"
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
                <p v-if="group.ownerId == user.id" class="text-gray-500 text-sm">
                  <span>{{ group.groupCode }}</span>
                  <button
                    class="ml-5 bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded hover:bg-gray-400"
                    @click.stop="copyGroupCode(group.groupCode)"
                  >
                    Copy
                  </button>
                </p>
                <p v-if="group.status == 'waiting'">
                  <span>Waiting for approval</span>
                </p>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-gray-500 text-center">No groups found. Join or create a new group.</p>
      </div>

      <!-- Create Box -->
      <div
        v-show="showCreateBox"
        class="mt-4 p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white transition-transform transform origin-top general-animate-fade"
      >
              <h3 class="text-lg font-bold mb-2">Create a New Group</h3>
        <input
          v-model="newGroupName"
          placeholder="Enter group name"
          class="border p-2 w-full mb-2 text-black rounded"
        />
        <select v-model="selectedDuration" class="border p-2 w-full mb-2 bg-transparent rounded">
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
          class="bg-white text-blue-500 px-4 py-2 rounded w-full font-semibold hover:bg-gray-100"
        >
          Create Group
        </button>
      </div>

      <!-- Join Box -->
      <div
        v-show="showJoinBox"
        class="mt-4 p-4 rounded-lg shadow-md bg-gradient-to-r from-green-400 to-blue-500 text-white transition-transform transform origin-top general-animate-fade"
      >
        <h3 class="text-lg font-bold mb-2">Join Group</h3>
        <input
          v-model="joinGroupCode"
          placeholder="Enter group code"
          class="border p-2 w-full mb-2 text-black rounded"
        />
        <input
          v-model="joinGroupMessage"
          placeholder="Message"
          class="border p-2 w-full mb-2 text-black rounded-lg"
        />
        <button
          @click="joinGroup"
          class="bg-white text-blue-500 px-4 py-2 rounded w-full font-semibold hover:bg-gray-100"
        >
          Join
        </button>
      </div>

      <!-- Display Create or Joined form  -->
      <div class="flex justify-between space-x-2 mt-4">
        <button
          class="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-800 transition"
          @click="toggleBox('create')"
        >
          Create Group
        </button>
        <button
          class="flex-1 bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-800 transition"
          @click="toggleBox('join')"
        >
          Join Group
        </button>
      </div>

    </div>


    <!-- Right Panel: Messages -->
    <div class="flex-grow p-4 flex flex-col h-screen">

      <div v-if="!currentGroupId" class="flex items-center justify-center flex-grow">
        <p class="text-gray-500 text-lg">Select a group to view messages.</p>
      </div>
      
      <div v-else class="flex flex-col h-full relative">

        <!-- Header -->
        <div class="flex mb-2 justify-between items-center bg-blue-100 p-4 rounded-lg shadow-md">
          <!-- Group Info -->
          <div>
            <h2 class="text-2xl font-bold text-blue-800 mb-1">
              {{ groupDetailHeader.groupName }}
            </h2>
            <p class="text-gray-600 text-sm flex items-center gap-4">
              <span>
                <i class="fas fa-user-friends mr-1 text-blue-600"></i>
                {{ groupDetailHeader.joinedMember }} joined
              </span>
              <span>
                <i class="fas fa-hourglass-half mr-1 text-yellow-500"></i>
                {{ groupDetailHeader.waitingMembers }} waiting for approval
              </span>
            </p>
          </div>

          <!-- Settings Button -->
          <button
            class="bg-white text-gray-600 px-3 py-2 rounded-full shadow hover:bg-gray-100 hover:shadow-lg transition flex items-center justify-center"
            @click="toggleSetting"
          >
            <i class="fas fa-cog text-xl"></i>
          </button>
        </div>


        <!-- List Messages -->
        <div
          ref="messagesContainer"
          class="messages flex-grow border rounded-lg p-4 overflow-y-auto bg-gray-50"
        >
          <div
            v-for="message in currentGroupMessages"
            :key="message.id"
            class="mb-6 flex"
            :class="message.userId === user.id ? 'flex-row-reverse' : ''"
          >
            <!-- Avatar -->
            <div class="flex flex-col items-center mr-3" :class="message.userId === user.id ? 'ml-3 mr-0' : ''">
              <img
                :src="`https://ui-avatars.com/api/?name=${message.userId}`"
                alt="Avatar"
                class="w-10 h-10 rounded-full mb-1"
              />
            </div>

            <!-- Message Content -->
            <div class="text-sm max-w-md flex flex-col">
              
              <div
                class="p-2"
                :class="[
                  'rounded-lg',
                  message.userId === user.id 
                    ? 'bg-blue-500 text-white text-right rounded-tl-lg rounded-tr-none' 
                    : 'bg-gray-200 text-left rounded-tl-none rounded-tr-lg'
                ]"
              >  
                <p 
                  :class="[ 
                      'font-bold ',
                      message.userId === user.id
                      ? 'text-gray-300'
                      : 'text-green-600'
                    ]">
                    {{ message.senderName }}
                </p>
                <p>{{ message.content }}</p>
  
            </div>
              <span
                class="text-gray-500 text-xs block mt-1"
                :class="message.userId === user.id ? 'text-right' : ''"
              >
                {{ new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>

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

        <!-- Overlay for setting bar -->
        <div
          v-if="showSetting"
          class="fixed inset-0 bg-black bg-opacity-50 z-10"
          @click="closeSetting"
        ></div>

        <!-- Setting Bar -->
        <div
          v-show="showSetting"
          class="absolute top-0 right-0 w-80 h-full bg-white shadow-lg border-l p-4 transition-transform transform z-20"
          :class="{ 'translate-x-0': showSetting, 'translate-x-full': !showSetting }"
        >
          <h3 class="text-lg font-bold mb-4">Group Settings</h3>
          <p class="text-gray-500 mb-2">Group Name: <span class="font-semibold">{{ groupSetting.name }}</span></p>
          <p class="text-gray-500 mb-2">Group Owner: <span class="font-semibold">{{ groupSetting.owner }}</span></p>

          <p class="text-gray-500 mb-4">Joined Members:</p>
          <ul class="list-disc pl-5">
            <li v-for="member in groupSetting.joinedMembers" :key="member.id" class="mb-1">
              <div >
                <span v-if="1">
                  {{ member.id == groupSetting.onwerId && member.id == user.id ? 'You' : member.name }}
                </span>
                <span v-if="user.id == groupSetting.onwerId && member.id != groupSetting.onwerId">
                  <button class="ml-3 text-red-500" @click="removeMember">Remove</button>
                </span>
              </div>
            </li>
          </ul>

          <p class="text-gray-500 mb-4">Waiting Members:</p>
          <ul class="list-disc pl-5">
            <li v-for="member in groupSetting.waitingMembers" :key="member.id" class="mb-1">
             
              <span>{{ member.name }} </span>
              <button class="ml-3 text-red-500" @click="declineMember(member.id)">Decline</button>
              <button class="ml-3 text-blue-500" @click="approveMember(member.id)">Approve</button>
              <p class="text-gray-500" >{{ member.message }}</p>
            </li>
          </ul>

          <div v-if="groupSetting.isOwner" class="mt-4">
            <button
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition w-full"
            >
              Delete Group
            </button>
          </div>
          <div v-else class="mt-4">
            <button
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition w-full"
            >
              Leave Group
            </button>
          </div>
        </div>



      </div>

    </div>


  </div>

  <div
    v-if="showToast"
    class="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-lg toast-animate-fade"
  >
    {{ toastMessage }}
  </div>

</template>

  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        messageDetailPage: 0,
        messageDetailLimit: 10,
        showSetting: false,
        groupSetting: {
          onwerId: "",
          name: "",
          owner: "",
          joinedMembers: [],
          waitingMembers: [],
          isOwner: false,
        },
        groupDetailHeader: {
          groupName: "",
          groupId: "",
          joinedMember: "",
          waitingMembers: "",
        },
        showCreateBox: false,
        showJoinBox: false,
        toastMessage: '',
        showToast: false,
        user: JSON.parse(localStorage.getItem("x-user")) || {}, // Retrieve user info
        groups: [],
        filteredGroups: [],
        currentGroupId: null,
        currentGroupName: "",
        currentGroupCode: "",
        joinGroupCode: "",
        joinGroupMessage: "",
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

      declineMember(memberId) {
        console.log("declineMember: " + memberId);
      },

      async approveMember(memberId) {
        console.log("approveMember: " + memberId);
        try {
          const response = await axios.post("http://localhost:8082/api/groups/approve", {
            groupId: this.currentGroupId,
            groupOwnerId: this.user.id,
            memberId: memberId,
          });

          if (response.data.status == 200) {
            alert(response.data.message);
            this.fetchGroups();
            this.selectGroup(this.currentGroupId);
            this.toggleSetting();
          } else {
            alert(response.data.message);
          }
        } catch (error) {
          console.error("Error joining group:", error.response?.data || error.message);
          alert("Failed to join group. Please try again.");
        }
      },

      toggleSetting() {
        this.showSetting = !this.showSetting;
        if (this.showSetting) {
          this.fetchSetting();
        }
      },

      closeSetting() {
        this.showSetting = false;
      },

      async fetchSetting() {
        try {
          const groupCode = this.currentGroupCode;
          const response = await axios.get(`/api/groups/setting/${groupCode}`);
          console.log(response.data);
          if (response.status === 200) {
            const data = response.data;
            this.groupSetting = {
              onwerId: data.ownerId,
              name: data.groupName,
              owner: data.ownerName,
              joinedMembers: data.listJoinedMember.map(member => ({
                id: member.memberId,
                name: member.memberName,
              })),
              waitingMembers: data.listWaitingMember.map(member => ({
                id: member.memberId,
                name: member.memberName,
                message: member.memberMessage,
              })),
              isOwner: data.ownerId === this.user.id, // Kiểm tra xem người dùng hiện tại có phải là chủ nhóm không
            };
          } else {
            console.error("Failed to fetch group setting data.");
          }
        } catch (error) {
          console.error("Error fetching group setting:", error);
        }
      },

      toggleBox(type) {
        if (type === "create") {
          this.showCreateBox = !this.showCreateBox;
          this.showJoinBox = false; // Ẩn Join Box
        } else if (type === "join") {
          this.showJoinBox = !this.showJoinBox;
          this.showCreateBox = false; // Ẩn Create Box
        }
      },

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
        this.currentGroupCode = this.groups.find(group => group.id === groupId)?.groupCode || '';

        // Fetch messages of group by group id
        // make a wrap to display group detail info

        var page = this.messageDetailPage;
        var limit = this.messageDetailLimit;
        try {
          const response = await axios.get(`http://localhost:8082/api/messages/group/${groupId}/${page}/${limit}`);
          this.messages = response.data.messages;

          this.groupDetailHeader.groupName = response.data.groupName;
          this.groupDetailHeader.groupId = response.data.groupId;
          this.groupDetailHeader.joinedMember = response.data.joinedMember;
          this.groupDetailHeader.waitingMembers = response.data.waitingMember;

          console.log(response);
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
        if (!this.newGroupName) {
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
            message: this.joinGroupMessage,
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

    /* Toast Notification Animation */
  @keyframes toastFade {
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

  .toast-animate-fade {
    animation: toastFade 1s ease-in-out;
  }

  /* General Fade Animation */
  @keyframes generalFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .general-animate-fade {
    animation: generalFadeIn 0.3s ease-out;
    transform: scale(1); /* Đặt trạng thái mặc định */
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



  /* Overlay Background */
  .bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
  }

  /* Transition Effect for Setting Bar */
  .transform {
    transition: transform 0.3s ease-in-out;
  }

  .translate-x-full {
    transform: translateX(100%);
  }

  .translate-x-0 {
    transform: translateX(0);
  }

  /* Disable pointer events when blurred */
  .pointer-events-none {
    pointer-events: none;
  }

  .shadow-md {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .shadow-lg {
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.15);
  }

  .rounded-full {
    border-radius: 9999px;
  }

  .transition {
    transition: all 0.2s ease-in-out;
  }

  .hover\:shadow-lg:hover {
    box-shadow: 0 8px 10px rgba(0, 0, 0, 0.2);
  }

</style>
  
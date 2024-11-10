<template>
    <div class="register-container flex items-center justify-center h-screen bg-gray-100">
      <div class="bg-white p-8 shadow rounded w-80">
        <h1 class="text-2xl font-bold mb-4">Register</h1>
        <input
          v-model="username"
          type="text"
          placeholder="Enter your username"
          class="border p-2 w-full mb-4"
        />
        <button
          @click="register"
          class="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600"
        >
          Register
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        username: "",
      };
    },
    methods: {
      async register() {
        if (!this.username) {
          alert("Username cannot be empty!");
          return;
        }
        try {
          // Call the register API
          const response = await axios.post("http://localhost:8082/api/users/register", {
            username: this.username,
          });
  
          // Store the returned user information in localStorage
          const userInfo = response.data;
          localStorage.setItem("x-user", JSON.stringify(userInfo)); // Save as a string
  
          // Redirect to chatroom
          this.$router.push("/chatroom");
        } catch (error) {
          console.error("Registration failed:", error.response?.data || error.message);
          alert("Failed to register. Please try again.");
        }
      },
    },
  };
  </script>
  
  <style>
  /* Add styling here if necessary */
  </style>
  
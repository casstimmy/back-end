import mongoose from "mongoose";

// Connection states
const STATES = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
};

// Global promise to track ongoing connection
let connectionPromise = null;

/**
 * Connect to MongoDB with connection pooling and error handling
 * @returns {Promise<mongoose.Connection>}
 */
export async function mongooseConnect() {
  // Already connected
  if (mongoose.connection.readyState === STATES.connected) {
    return mongoose.connection;
  }

  // Connection in progress - wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  // Connection options for production
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: true,  // Allow buffering while connecting
  };

  try {
    connectionPromise = mongoose.connect(uri, options);
    
    await connectionPromise;
    
    // Set up connection event handlers (only once)
    if (!mongoose.connection._eventsSetup) {
      mongoose.connection.on("connected", () => {
        console.log("[MongoDB] Connected successfully");
      });

      mongoose.connection.on("error", (err) => {
        console.error("[MongoDB] Connection error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("[MongoDB] Disconnected");
        connectionPromise = null;
      });

      mongoose.connection._eventsSetup = true;
    }

    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    console.error("[MongoDB] Failed to connect:", error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export async function mongooseDisconnect() {
  if (mongoose.connection.readyState !== STATES.disconnected) {
    await mongoose.disconnect();
    connectionPromise = null;
  }
}
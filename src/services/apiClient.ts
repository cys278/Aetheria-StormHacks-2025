import axios from "axios";

// --- Type Definitions ---
// These types create a contract between your frontend and backend.
// They ensure data consistency and provide excellent autocompletion.

// 1. Defines the data we must SEND to the /converse endpoint.
export interface ConverseRequest {
  sessionId: string;
  message: string;
  harmonyScore: number;
  history: {
    user: string;
    bot: string;
  }[];
}

// 2. Defines the data structure we EXPECT to receive from the /converse endpoint.
export interface ConverseResponse {
  responseText: string;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  updatedHarmonyScore: number;
  pulseRhythm: "calm" | "erratic" | "steady";
}

// --- Axios Instance Creation ---

// 3. Read the base URL from the environment variables.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 4. Create a configured Axios instance.
// Using an instance is a best practice for setting base URLs, headers, and timeouts.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- API Service Function ---

/**
 * Sends a message to the Aetheria backend.
 * @param data The request payload containing the sessionId and message.
 * @returns A promise that resolves with the full ConverseResponse object.
 */
export const postConverse = async (
  data: ConverseRequest
): Promise<ConverseResponse> => {
  try {
    // 5. Make the POST request to the '/converse' endpoint.
    // The base URL '/api' is automatically prepended by the instance.
    // We pass the expected response type to `post` for type safety.
    const response = await apiClient.post<ConverseResponse>("/converse", data);

    // 6. Axios nests the actual API response in a `data` property.
    return response.data;
  } catch (error) {
    // 7. Log the error and re-throw it so the calling component can handle it.
    console.error("Error calling /converse API:", error);
    // This allows UI components to set an error state, show a message, etc.
    throw error;
  }
};

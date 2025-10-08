// src/services/apiClient.ts

import axios from "axios";
import { type ConverseRequest, type ConverseResponse } from "../types";

// --- Axios Instance Creation ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- API Service Function ---

export const postConverse = async (
  data: ConverseRequest
): Promise<ConverseResponse> => {
  try {
    const response = await apiClient.post<ConverseResponse>("/converse", data);
    return response.data;
  } catch (error) {
    console.error("Error calling /converse API:", error);
    throw error;
  }
};

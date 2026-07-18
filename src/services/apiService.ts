import { fetchApi } from "../utils/apiHelper";

export interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }> | string;
}

export const apiService = {
  /**
   * Razorpay Order Creation
   */
  async createPaymentOrder(payload: {
    amount: number;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    return fetchApi("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Razorpay Payment Verification
   */
  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderDetails: any;
  }) {
    return fetchApi("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Shiprocket Serviceability and Pricing Calculation
   */
  async calculateShipping(payload: {
    pincode: string;
    weight: number;
    amount: number;
  }) {
    return fetchApi("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Ask AI Spiritual Guru Chat
   */
  async askAIGuru(payload: {
    message: string;
    history?: ChatMessage[];
  }) {
    return fetchApi("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get chapters configured for subjects
   */
  async getOrUpdateQuizChapters(payload: { subjectId: string }) {
    return fetchApi("/api/quiz/get-or-create-chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Generate Quiz Questions via AI
   */
  async generateQuiz(payload: {
    subjectId: string;
    chapterId: string;
    difficulty: string;
    count: number;
  }) {
    return fetchApi("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
};

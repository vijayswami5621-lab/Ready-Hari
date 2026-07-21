package com.haripathshala.app.data.model

import com.google.firebase.firestore.PropertyName
import java.io.Serializable

// --- Authentication & User Profiles ---
data class UserProfile(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val photoUrl: String = "",
    val role: String = "student",
    val onboardingCompleted: Boolean = false,
    val joinedAt: Long = 0L
) : Serializable

data class UserStats(
    val xp: Int = 0,
    val streak: Int = 0,
    val lastActiveDate: String = "",
    val quizzesCompleted: Int = 0,
    val versesRead: Int = 0,
    val hoursStudied: Float = 0.0f
)

data class Achievement(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val icon: String = "",
    val unlockedAt: Long = 0L
)

data class Certificate(
    val id: String = "",
    val subjectId: String = "",
    val title: String = "",
    val recipientName: String = "",
    val issuedAt: Long = 0L,
    val certificateUrl: String = ""
)

// --- Scripture / Adhyayan ---
data class ScriptureCategory(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val coverImage: String = "",
    val order: Int = 0
)

data class ScriptureVerse(
    val verseNumber: Int = 0,
    val text: String = "",
    val transliteration: String = "",
    val translation: String = "",
    val commentary: String = "",
    val audioUrl: String? = null
)

data class ScriptureChapter(
    val chapterNumber: Int = 0,
    val name: String = "",
    val description: String = "",
    val versesCount: Int = 0,
    val verses: List<ScriptureVerse> = emptyList()
)

data class ReadingProgress(
    val categoryId: String = "",
    val lastReadChapter: Int = 1,
    val lastReadVerse: Int = 1,
    val completedVerses: List<String> = emptyList(),
    val progressPercent: Int = 0,
    val updatedAt: Long = 0L
)

// --- AI Guru ---
data class ChatSession(
    val sessionId: String = "",
    val title: String = "",
    val createdAt: Long = 0L
)

data class ChatMessage(
    val id: String = "",
    val role: String = "", // "user" or "model"
    val content: String = "",
    val timestamp: Long = 0L
)

// --- Panchang ---
data class PanchangRequest(
    val date: String, // "YYYY-MM-DD"
    val latitude: Double,
    val longitude: Double,
    val timezone: String = "Asia/Kolkata"
)

data class PanchangData(
    val sunRise: String = "",
    val sunSet: String = "",
    val moonRise: String = "",
    val moonSet: String = "",
    val tithi: String = "",
    val nakshatra: String = "",
    val yoga: String = "",
    val karana: String = "",
    val rahuKaal: String = "",
    val gulikaKaal: String = "",
    val yamaGanda: String = "",
    val abhijitMuhurta: String = "",
    val amritKaal: String = ""
)

// --- Store ---
data class Product(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val mrp: Double = 0.0,
    val images: List<String> = emptyList(),
    val stock: Int = 0,
    val weight: Double = 0.5, // in kg
    val categories: List<String> = emptyList(),
    val averageRating: Float = 5.0f,
    val reviewsCount: Int = 0
)

data class CartItem(
    val product: Product,
    var quantity: Int = 1
)

data class ShippingAddress(
    val id: String = "",
    val name: String = "",
    val phone: String = "",
    val email: String = "",
    val line1: String = "",
    val line2: String = "",
    val city: String = "",
    val state: String = "",
    val pincode: String = "",
    val country: String = "India"
)

data class ShippingCharges(
    val available: Boolean = false,
    val rate: Double = 0.0,
    val codCharges: Double = 0.0,
    val estimatedDays: Int = 5
)

data class OrderItem(
    val productId: String = "",
    val title: String = "",
    val price: Double = 0.0,
    val quantity: Int = 1,
    val image: String = ""
)

data class Order(
    val id: String = "",
    val userId: String = "",
    val items: List<OrderItem> = emptyList(),
    val subtotal: Double = 0.0,
    val shippingCharges: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
    val address: ShippingAddress = ShippingAddress(),
    val paymentMethod: String = "razorpay", // "cod" or "razorpay"
    val paymentId: String = "",
    val orderId: String = "", // Razorpay Order ID
    val status: String = "pending", // "pending", "paid", "processing", "shipped", "delivered", "failed"
    val trackingNumber: String = "",
    val courierName: String = "",
    val shiprocketOrderId: String = "",
    val shiprocketShipmentId: String = "",
    val createdAt: Long = 0L
)

// --- Quotes & Doha ---
data class Quote(
    val id: String = "",
    val text: String = "",
    val author: String = "Unknown",
    val category: String = "Wisdom"
)

data class Doha(
    val id: String = "",
    val text: String = "",
    val translation: String = "",
    val explanation: String = "",
    val poet: String = "Kabir"
)

// --- Gamified Quizzes ---
data class Subject(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val order: Int = 0
)

data class Chapter(
    val id: String = "",
    val name: String = "",
    val order: Int = 0,
    val questionsCount: Int = 0
)

data class QuizQuestion(
    val id: String = "",
    val question: String = "",
    val options: List<String> = emptyList(),
    val correctAnswerIndex: Int = 0,
    val explanation: String = ""
)

data class QuizLeaderboardEntry(
    val uid: String = "",
    val name: String = "",
    val photoUrl: String = "",
    val xp: Int = 0,
    val streak: Int = 0,
    val rank: Int = 0
)

// --- Community Post ---
data class CommunityPost(
    val id: String = "",
    val userId: String = "",
    val userName: String = "",
    val userPhotoUrl: String = "",
    val content: String = "",
    val category: String = "General",
    val likesCount: Int = 0,
    val commentsCount: Int = 0,
    val likes: List<String> = emptyList(),
    val createdAt: Long = 0L
)

data class Experience(
    val id: String = "",
    val userId: String = "",
    val userName: String = "",
    val userPhotoUrl: String = "",
    val title: String = "",
    val content: String = "",
    val duration: String = "",
    val createdAt: Long = 0L
)

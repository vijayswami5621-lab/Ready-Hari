package com.haripathshala.app.data.network

import com.haripathshala.app.data.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // --- AI Guru ---
    @POST("api/chat")
    suspend fun sendChatMessage(
        @Body request: ChatRequest
    ): Response<ChatResponse>

    // --- Panchang ---
    @POST("api/panchang")
    suspend fun getPanchang(
        @Body request: PanchangRequest
    ): Response<PanchangData>

    // --- Store Payment & Shipping ---
    @POST("api/shipping/calculate")
    suspend fun calculateShipping(
        @Body request: ShippingCalculateRequest
    ): Response<ShippingCalculateResponse>

    @POST("api/payment/create-order")
    suspend fun createPaymentOrder(
        @Body request: PaymentOrderRequest
    ): Response<PaymentOrderResponse>

    @POST("api/payment/verify")
    suspend fun verifyPayment(
        @Body request: PaymentVerifyRequest
    ): Response<PaymentVerifyResponse>

    // --- Adhyayan & Scripture API ---
    @POST("api/adhyayan/chapter-verses")
    suspend fun getChapterVerses(
        @Body request: ChapterVersesRequest
    ): Response<ChapterVersesResponse>

    @POST("api/adhyayan/search")
    suspend fun searchScripture(
        @Body request: SearchRequest
    ): Response<SearchResponse>

    @POST("api/adhyayan/ai-content")
    suspend fun getAiCommentary(
        @Body request: AiCommentaryRequest
    ): Response<AiCommentaryResponse>

    @POST("api/adhyayan/generate-recitation")
    suspend fun generateRecitation(
        @Body request: RecitationRequest
    ): Response<RecitationResponse>

    // --- Gamified Quizzes ---
    @POST("api/quiz/get-or-create-chapters")
    suspend fun getOrCreateChapters(
        @Body request: GetChaptersRequest
    ): Response<GetChaptersResponse>

    @POST("api/quiz/pre-generate")
    suspend fun preGenerateQuiz(
        @Body request: PreGenerateQuizRequest
    ): Response<PreGenerateQuizResponse>

    @POST("api/quiz/generate")
    suspend fun generateQuiz(
        @Body request: GenerateQuizRequest
    ): Response<GenerateQuizResponse>

    @POST("api/quiz/generate-additional")
    suspend fun generateAdditionalQuestion(
        @Body request: AdditionalQuestionRequest
    ): Response<AdditionalQuestionResponse>

    // --- Dynamic Quotes Generation ---
    @POST("api/generate-quote")
    suspend fun generateAiQuote(
        @Body request: Map<String, String>
    ): Response<QuoteResponse>
}

// --- Request / Response Payloads ---

data class ChatRequest(
    val prompt: String,
    val history: List<Map<String, String>> = emptyList(),
    val tone: String = "spiritual"
)

data class ChatResponse(
    val reply: String,
    val sourceVerses: List<String> = emptyList()
)

data class ShippingCalculateRequest(
    val deliveryPincode: String,
    val items: List<CartItemPayload>,
    val cod: Boolean = false
)

data class CartItemPayload(
    val productId: String,
    val quantity: Int,
    val weight: Double
)

data class ShippingCalculateResponse(
    val success: Boolean,
    val charges: ShippingCharges,
    val error: String? = null
)

data class PaymentOrderRequest(
    val amount: Double,
    val currency: String = "INR",
    val receiptId: String,
    val notes: Map<String, String> = emptyMap()
)

data class PaymentOrderResponse(
    val success: Boolean,
    val orderId: String,
    val amount: Double,
    val currency: String
)

data class PaymentVerifyRequest(
    val razorpayOrderId: String,
    val razorpayPaymentId: String,
    val razorpaySignature: String,
    val orderDetails: Order
)

data class PaymentVerifyResponse(
    val success: Boolean,
    val message: String,
    val orderId: String? = null
)

data class ChapterVersesRequest(
    val categoryId: String,
    val chapterNumber: Int
)

data class ChapterVersesResponse(
    val success: Boolean,
    val verses: List<ScriptureVerse>
)

data class SearchRequest(
    val query: String,
    val categoryId: String? = null
)

data class SearchResponse(
    val success: Boolean,
    val results: List<SearchResultItem>
)

data class SearchResultItem(
    val categoryId: String,
    val categoryName: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val text: String,
    val translation: String
)

data class AiCommentaryRequest(
    val categoryId: String,
    val chapterNumber: Int,
    val verseNumber: Int,
    val verseText: String,
    val translation: String,
    val userQuery: String? = null
)

data class AiCommentaryResponse(
    val success: Boolean,
    val analysis: String,
    val practicalApplication: String,
    val vocabulary: Map<String, String>
)

data class RecitationRequest(
    val text: String,
    val language: String = "sa" // Sanskrit
)

data class RecitationResponse(
    val success: Boolean,
    val audioUrl: String
)

data class GetChaptersRequest(
    val subjectId: String
)

data class GetChaptersResponse(
    val success: Boolean,
    val chapters: List<Chapter>
)

data class PreGenerateQuizRequest(
    val subjectId: String,
    val chapterId: String
)

data class PreGenerateQuizResponse(
    val success: Boolean,
    val message: String
)

data class GenerateQuizRequest(
    val subjectId: String,
    val chapterId: String,
    val count: Int = 5,
    val difficulty: String = "medium"
)

data class GenerateQuizResponse(
    val success: Boolean,
    val questions: List<QuizQuestion>
)

data class AdditionalQuestionRequest(
    val subjectId: String,
    val chapterId: String,
    val existingQuestionIds: List<String>
)

data class AdditionalQuestionResponse(
    val success: Boolean,
    val question: QuizQuestion
)

data class QuoteResponse(
    val success: Boolean,
    val quote: Quote
)

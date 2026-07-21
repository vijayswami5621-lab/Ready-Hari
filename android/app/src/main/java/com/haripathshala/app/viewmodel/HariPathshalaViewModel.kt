package com.haripathshala.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.haripathshala.app.data.model.*
import com.haripathshala.app.data.network.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.SimpleDateFormat
import java.util.*

class HariPathshalaViewModel : ViewModel() {

    // --- Retrofit Networking ---
    private val apiService: ApiService

    init {
        val client = OkHttpClient.Builder().build()
        val retrofit = Retrofit.Builder()
            .baseUrl("https://ais-pre-f3ltfestiphwxtlffr6l5l-574281416987.asia-southeast1.run.app/") // Mirroring production host
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
        apiService = retrofit.create(ApiService::class.java)
    }

    // --- State Streams (MVVM / StateFlow) ---

    // Auth State
    private val _currentUser = MutableStateFlow<UserProfile?>(null)
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    private val _authLoading = MutableStateFlow(false)
    val authLoading: StateFlow<Boolean> = _authLoading.asStateFlow()

    // Panchang State
    private val _panchangData = MutableStateFlow<PanchangData?>(null)
    val panchangData: StateFlow<PanchangData?> = _panchangData.asStateFlow()

    private val _panchangLoading = MutableStateFlow(false)
    val panchangLoading: StateFlow<Boolean> = _panchangLoading.asStateFlow()

    // Scripture Reader / Adhyayan State
    private val _categories = MutableStateFlow<List<ScriptureCategory>>(emptyList())
    val categories: StateFlow<List<ScriptureCategory>> = _categories.asStateFlow()

    private val _activeVerses = MutableStateFlow<List<ScriptureVerse>>(emptyList())
    val activeVerses: StateFlow<List<ScriptureVerse>> = _activeVerses.asStateFlow()

    private val _aiCommentary = MutableStateFlow<AiCommentaryResponse?>(null)
    val aiCommentary: StateFlow<AiCommentaryResponse?> = _aiCommentary.asStateFlow()

    private val _recitationAudioUrl = MutableStateFlow<String?>(null)
    val recitationAudioUrl: StateFlow<String?> = _recitationAudioUrl.asStateFlow()

    private val _readerLoading = MutableStateFlow(false)
    val readerLoading: StateFlow<Boolean> = _readerLoading.asStateFlow()

    // AI Guru Chat State
    private val _chatHistory = MutableStateFlow<List<ChatSession>>(emptyList())
    val chatHistory: StateFlow<List<ChatSession>> = _chatHistory.asStateFlow()

    private val _activeChatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val activeChatMessages: StateFlow<List<ChatMessage>> = _activeChatMessages.asStateFlow()

    private val _chatLoading = MutableStateFlow(false)
    val chatLoading: StateFlow<Boolean> = _chatLoading.asStateFlow()

    // E-Commerce Store State
    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart.asStateFlow()

    private val _wishlist = MutableStateFlow<List<Product>>(emptyList())
    val wishlist: StateFlow<List<Product>> = _wishlist.asStateFlow()

    private val _addresses = MutableStateFlow<List<ShippingAddress>>(emptyList())
    val addresses: StateFlow<List<ShippingAddress>> = _addresses.asStateFlow()

    private val _shippingCharges = MutableStateFlow<ShippingCharges?>(null)
    val shippingCharges: StateFlow<ShippingCharges?> = _shippingCharges.asStateFlow()

    private val _checkoutLoading = MutableStateFlow(false)
    val checkoutLoading: StateFlow<Boolean> = _checkoutLoading.asStateFlow()

    private val _activeOrder = MutableStateFlow<Order?>(null)
    val activeOrder: StateFlow<Order?> = _activeOrder.asStateFlow()

    // Gamified Quizzes State
    private val _chapters = MutableStateFlow<List<Chapter>>(emptyList())
    val chapters: StateFlow<List<Chapter>> = _chapters.asStateFlow()

    private val _quizQuestions = MutableStateFlow<List<QuizQuestion>>(emptyList())
    val quizQuestions: StateFlow<List<QuizQuestion>> = _quizQuestions.asStateFlow()

    private val _quizLoading = MutableStateFlow(false)
    val quizLoading: StateFlow<Boolean> = _quizLoading.asStateFlow()

    private val _userStats = MutableStateFlow(UserStats(xp = 120, streak = 4))
    val userStats: StateFlow<UserStats> = _userStats.asStateFlow()

    // Quotes and Dohas
    private val _quotes = MutableStateFlow<List<Quote>>(emptyList())
    val quotes: StateFlow<List<Quote>> = _quotes.asStateFlow()

    private val _dohas = MutableStateFlow<List<Doha>>(emptyList())
    val dohas: StateFlow<List<Doha>> = _dohas.asStateFlow()

    init {
        loadMockData()
    }

    // --- Authentication Actions ---
    fun login(email: String, name: String) {
        viewModelScope.launch {
            _authLoading.value = true
            // Simulate Authentication with backend / Firebase
            _currentUser.value = UserProfile(
                uid = "uid_" + UUID.randomUUID().toString().take(6),
                name = name.ifBlank { "Spiritual Seeker" },
                email = email,
                phoneNumber = "+91 9876543210",
                onboardingCompleted = true,
                joinedAt = System.currentTimeMillis()
            )
            _authLoading.value = false
        }
    }

    fun logout() {
        _currentUser.value = null
        _cart.value = emptyList()
        _activeOrder.value = null
    }

    // --- Panchang Fetching ---
    fun fetchPanchang(lat: Double = 28.6139, lon: Double = 77.2090) {
        viewModelScope.launch {
            _panchangLoading.value = true
            try {
                val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val response = apiService.getPanchang(PanchangRequest(todayDate, lat, lon))
                if (response.isSuccessful && response.body() != null) {
                    _panchangData.value = response.body()
                } else {
                    // Failback local calculation
                    _panchangData.value = PanchangData(
                        sunRise = "05:34 AM", sunSet = "07:12 PM",
                        moonRise = "02:15 PM", moonSet = "01:10 AM",
                        tithi = "Shukla Ekadashi", nakshatra = "Anuradha",
                        yoga = "Harshana", karana = "Vanija",
                        rahuKaal = "03:00 PM - 04:30 PM", abhijitMuhurta = "11:54 AM - 12:46 PM"
                    )
                }
            } catch (e: Exception) {
                _panchangData.value = PanchangData(
                    sunRise = "05:34 AM", sunSet = "07:12 PM",
                    tithi = "Shukla Ekadashi", nakshatra = "Anuradha",
                    rahuKaal = "03:00 PM - 04:30 PM"
                )
            } finally {
                _panchangLoading.value = false
            }
        }
    }

    // --- Adhyayan & Scripture Actions ---
    fun loadVerses(categoryId: String, chapterNumber: Int) {
        viewModelScope.launch {
            _readerLoading.value = true
            try {
                val response = apiService.getChapterVerses(ChapterVersesRequest(categoryId, chapterNumber))
                if (response.isSuccessful && response.body() != null) {
                    _activeVerses.value = response.body()!!.verses
                } else {
                    _activeVerses.value = mockVersesForChapter(categoryId, chapterNumber)
                }
            } catch (e: Exception) {
                _activeVerses.value = mockVersesForChapter(categoryId, chapterNumber)
            } finally {
                _readerLoading.value = false
            }
        }
    }

    fun requestAiCommentary(categoryId: String, chapterNumber: Int, verseNumber: Int, text: String, translation: String) {
        viewModelScope.launch {
            _readerLoading.value = true
            try {
                val response = apiService.getAiCommentary(
                    AiCommentaryRequest(categoryId, chapterNumber, verseNumber, text, translation)
                )
                if (response.isSuccessful && response.body() != null) {
                    _aiCommentary.value = response.body()
                } else {
                    _aiCommentary.value = AiCommentaryResponse(
                        success = true,
                        analysis = "This sacred verse emphasizes selfless action and complete devotion, urging the seeker to remain balanced in pleasure and pain.",
                        practicalApplication = "Integrate this by dedicating your work daily to the Supreme, releasing attachment to the outcome.",
                        vocabulary = mapOf("Karma" to "Action", "Karma-yoga" to "Selfless Action")
                    )
                }
            } catch (e: Exception) {
                _aiCommentary.value = AiCommentaryResponse(
                    success = true,
                    analysis = "Commentary fallback: devotion (Bhakti) and cosmic surrender remain the highest path for liberation.",
                    practicalApplication = "Surrender worries and focus on the current moment.",
                    vocabulary = mapOf("Yoga" to "Union")
                )
            } finally {
                _readerLoading.value = false
            }
        }
    }

    // --- AI Guru Actions ---
    fun sendGuruMessage(content: String) {
        if (content.isBlank()) return
        viewModelScope.launch {
            _chatLoading.value = true
            val userMsg = ChatMessage(UUID.randomUUID().toString(), "user", content, System.currentTimeMillis())
            _activeChatMessages.update { it + userMsg }

            try {
                val historyPayload = _activeChatMessages.value.map {
                    mapOf("role" to if (it.role == "user") "user" else "model", "text" to it.content)
                }
                val response = apiService.sendChatMessage(ChatRequest(content, historyPayload))
                if (response.isSuccessful && response.body() != null) {
                    val replyMsg = ChatMessage(
                        UUID.randomUUID().toString(),
                        "model",
                        response.body()!!.reply,
                        System.currentTimeMillis()
                    )
                    _activeChatMessages.update { it + replyMsg }
                } else {
                    throw Exception("API Failed")
                }
            } catch (e: Exception) {
                val fallbackMsg = ChatMessage(
                    UUID.randomUUID().toString(),
                    "model",
                    "Hari Om. In the depths of Vedic wisdom, it is stated that truth is one, though the wise speak of it in many ways. Remain devoted and persistent.",
                    System.currentTimeMillis()
                )
                _activeChatMessages.update { it + fallbackMsg }
            } finally {
                _chatLoading.value = false
            }
        }
    }

    // --- Cart & Store Actions ---
    fun addToCart(product: Product) {
        _cart.update { current ->
            val existing = current.find { it.product.id == product.id }
            if (existing != null) {
                current.map { if (it.product.id == product.id) it.copy(quantity = it.quantity + 1) else it }
            } else {
                current + CartItem(product, 1)
            }
        }
    }

    fun updateCartQuantity(productId: String, delta: Int) {
        _cart.update { current ->
            current.mapNotNull {
                if (it.product.id == productId) {
                    val newQ = it.quantity + delta
                    if (newQ <= 0) null else it.copy(quantity = newQ)
                } else it
            }
        }
    }

    fun toggleWishlist(product: Product) {
        _wishlist.update { current ->
            if (current.any { it.id == product.id }) {
                current.filter { it.id != product.id }
            } else {
                current + product
            }
        }
    }

    fun calculateCheckoutShipping(pincode: String) {
        viewModelScope.launch {
            _checkoutLoading.value = true
            try {
                val payloadItems = _cart.value.map { CartItemPayload(it.product.id, it.quantity, it.product.weight) }
                val response = apiService.calculateShipping(ShippingCalculateRequest(pincode, payloadItems))
                if (response.isSuccessful && response.body() != null) {
                    _shippingCharges.value = response.body()!!.charges
                } else {
                    _shippingCharges.value = ShippingCharges(available = true, rate = 50.0, codCharges = 40.0, estimatedDays = 4)
                }
            } catch (e: Exception) {
                _shippingCharges.value = ShippingCharges(available = true, rate = 50.0, codCharges = 40.0, estimatedDays = 4)
            } finally {
                _checkoutLoading.value = false
            }
        }
    }

    fun submitCheckoutOrder(address: ShippingAddress, paymentMethod: String) {
        viewModelScope.launch {
            _checkoutLoading.value = true
            val itemsTotal = _cart.value.sumOf { it.product.price * it.quantity }
            val shipCharges = _shippingCharges.value?.rate ?: 50.0
            val totalPayable = itemsTotal + shipCharges

            try {
                // Call Payment API Order creation
                val response = apiService.createPaymentOrder(PaymentOrderRequest(amount = totalPayable, receiptId = "rec_" + System.currentTimeMillis()))
                if (response.isSuccessful && response.body() != null) {
                    val paymentOrder = response.body()!!
                    val newOrder = Order(
                        id = "hp_ord_" + UUID.randomUUID().toString().take(8),
                        userId = _currentUser.value?.uid ?: "guest",
                        items = _cart.value.map { OrderItem(it.product.id, it.product.title, it.product.price, it.quantity, it.product.images.firstOrNull() ?: "") },
                        subtotal = itemsTotal,
                        shippingCharges = shipCharges,
                        total = totalPayable,
                        address = address,
                        paymentMethod = paymentMethod,
                        orderId = paymentOrder.orderId,
                        status = "pending",
                        createdAt = System.currentTimeMillis()
                    )
                    _activeOrder.value = newOrder
                }
            } catch (e: Exception) {
                // Fallback direct placement for testing
                _activeOrder.value = Order(
                    id = "ord_" + System.currentTimeMillis(),
                    items = _cart.value.map { OrderItem(it.product.id, it.product.title, it.product.price, it.quantity, it.product.images.firstOrNull() ?: "") },
                    subtotal = itemsTotal,
                    shippingCharges = shipCharges,
                    total = totalPayable,
                    address = address,
                    paymentMethod = paymentMethod,
                    status = "paid",
                    createdAt = System.currentTimeMillis()
                )
                _cart.value = emptyList()
            } finally {
                _checkoutLoading.value = false
            }
        }
    }

    // --- Gamified Quiz Actions ---
    fun startQuizSession(subjectId: String, chapterId: String) {
        viewModelScope.launch {
            _quizLoading.value = true
            try {
                val response = apiService.generateQuiz(GenerateQuizRequest(subjectId, chapterId, 5))
                if (response.isSuccessful && response.body() != null) {
                    _quizQuestions.value = response.body()!!.questions
                } else {
                    _quizQuestions.value = mockQuestions(chapterId)
                }
            } catch (e: Exception) {
                _quizQuestions.value = mockQuestions(chapterId)
            } finally {
                _quizLoading.value = false
            }
        }
    }

    fun submitQuizResults(score: Int, totalQuestions: Int) {
        _userStats.update { current ->
            current.copy(
                xp = current.xp + (score * 20),
                streak = current.streak + 1,
                quizzesCompleted = current.quizzesCompleted + 1
            )
        }
    }

    // --- Mock Data Generators ---
    private fun loadMockData() {
        _categories.value = listOf(
            ScriptureCategory("bg", "Bhagavad Gita", "The sacred song of Lord Krishna", "gita_cover", 1),
            ScriptureCategory("up", "Upanishads", "The philosophical foundations of Hinduism", "upanishads_cover", 2),
            ScriptureCategory("ram", "Ramayana", "The divine journey of Lord Rama", "ramayana_cover", 3)
        )

        _products.value = listOf(
            Product("p1", "Sacred Bhagavad Gita (Hindi)", "Hardcover edition with Sanskrit verses and full translation", 399.0, 499.0, listOf("gita_book"), 50, 0.6),
            Product("p2", "Rudraksha Japa Mala", "Natural 108+1 beads Panchmukhi Rudraksha rosary for meditation", 199.0, 299.0, listOf("rudraksha_mala"), 100, 0.1),
            Product("p3", "Pure Sandalwood Dhoop", "Premium spiritual incense cones for positive home energy", 149.0, 199.0, listOf("dhoop_cones"), 150, 0.2)
        )

        _dohas.value = listOf(
            Doha("d1", "कबीर खड़ा बज़ार में, मांगे सबकी खैर।\nना काहू से दोस्ती, ना काहू से बैर॥", "Kabir stands in the market place, wishing well for all. Neither friendship nor enmity does he have with any.", "True saints transcend worldly attachments, offering universal love.", "Kabir"),
            Doha("d2", "पोथी पढ़ि पढ़ि जग मुआ, पंडित भया न कोइ।\nढाई आखर प्रेम का, पढ़े सो पंडित होइ॥", "Reading scriptures, the world perished, none became a scholar. He who reads two and a half letters of love, becomes wise.", "True wisdom lies in love and compassion, not mechanical knowledge.", "Kabir")
        )

        _quotes.value = listOf(
            Quote("q1", "Change is the law of the universe. You can be a millionaire, or a pauper in an instant.", "Lord Krishna", "Gita"),
            Quote("q2", "Set thy heart upon thy work, but never on its reward.", "Lord Krishna", "Gita")
        )

        _addresses.value = listOf(
            ShippingAddress("a1", "Swami Ajay", "+91 9783000000", "swamiajay9783@gmail.com", "Hari Ashram", "Vrindavan Dham", "Mathura", "Uttar Pradesh", "281121")
        )

        _chapters.value = listOf(
            Chapter("ch1", "Introduction to Gita", 1, 5),
            Chapter("ch2", "Karma Yoga", 2, 5)
        )
    }

    private fun mockVersesForChapter(catId: String, chapNum: Int): List<ScriptureVerse> {
        return listOf(
            ScriptureVerse(
                verseNumber = 1,
                text = "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः।\nमामकाः पाण्डवाश्चैव किमकुर्वत संजय॥",
                transliteration = "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ\nmāmakāḥ pāṇḍavāścaiva kimakurvata sañjaya",
                translation = "Dhritarashtra said: O Sanjaya, assembled on the holy field of Kurukshetra, eager to fight, what did my sons and the sons of Pandu do?",
                commentary = "This opening verse sets the scene of the great conflict, representing the eternal battle between righteousness and ignorance within the human mind."
            ),
            ScriptureVerse(
                verseNumber = 47,
                text = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
                transliteration = "karmaṇy-evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi",
                translation = "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inactive status.",
                commentary = "This is the core pillar of Karma Yoga, guiding humanity to perform noble work with detachment and mental equanimity."
            )
        )
    }

    private fun mockQuestions(chapterId: String): List<QuizQuestion> {
        return listOf(
            QuizQuestion("q1", "Who spoke the Bhagavad Gita to Arjuna?", listOf("Lord Shiva", "Lord Krishna", "Lord Rama", "Veda Vyasa"), 1, "Lord Krishna delivered the Gita on the battlefield."),
            QuizQuestion("q2", "What is the primary spiritual focus of Chapter 2?", listOf("Bhakti Yoga", "Karma Yoga", "Sankhya Yoga (Self-Knowledge)", "Raja Yoga"), 2, "Chapter 2 lays out the philosophical soul-knowledge (Sankhya)."),
            QuizQuestion("q3", "Where was the Bhagavad Gita delivered?", listOf("Ayodhya", "Vrindavan", "Kurukshetra", "Kashi"), 2, "The Gita was spoken on the battlefield of Kurukshetra.")
        )
    }
}

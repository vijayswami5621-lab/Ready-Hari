package com.haripathshala.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.haripathshala.app.data.model.*
import com.haripathshala.app.ui.navigation.Screen
import com.haripathshala.app.ui.theme.SaffronPrimary
import com.haripathshala.app.ui.theme.SaffronDark
import com.haripathshala.app.ui.theme.GoldAccent
import com.haripathshala.app.viewmodel.HariPathshalaViewModel
import kotlinx.coroutines.delay

// --- UTILS & COMMON COMPONENTS ---

@Composable
fun MainHeader(title: String, onBackClick: (() -> Unit)? = null, actions: @Composable (RowScope.() -> Unit)? = null) {
    SmallTopAppBar(
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
        },
        navigationIcon = {
            if (onBackClick != null) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        },
        actions = {
            actions?.invoke(this)
        },
        colors = TopAppBarDefaults.smallTopAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun SimpleBottomNavBar(navController: NavHostController, currentRoute: String) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentRoute == Screen.Home.route,
            onClick = { navController.navigate(Screen.Home.route) { popUpTo(Screen.Home.route) { inclusive = true } } },
            icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
            label = { Text("Home") }
        )
        NavigationBarItem(
            selected = currentRoute == Screen.ScriptureList.route,
            onClick = { navController.navigate(Screen.ScriptureList.route) },
            icon = { Icon(Icons.Default.Book, contentDescription = "Scriptures") },
            label = { Text("Scriptures") }
        )
        NavigationBarItem(
            selected = currentRoute == Screen.AiGuru.route,
            onClick = { navController.navigate(Screen.AiGuru.route) },
            icon = { Icon(Icons.Default.Face, contentDescription = "AI Guru") },
            label = { Text("AI Guru") }
        )
        NavigationBarItem(
            selected = currentRoute == Screen.Store.route,
            onClick = { navController.navigate(Screen.Store.route) },
            icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Store") },
            label = { Text("Store") }
        )
        NavigationBarItem(
            selected = currentRoute == Screen.Profile.route,
            onClick = { navController.navigate(Screen.Profile.route) },
            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
            label = { Text("Profile") }
        )
    }
}

// --- 1. SPLASH SCREEN ---
@Composable
fun SplashScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()

    LaunchedEffect(key1 = true) {
        delay(2000)
        if (currentUser != null) {
            navController.navigate(Screen.Home.route) {
                popUpTo(Screen.Splash.route) { inclusive = true }
            }
        } else {
            navController.navigate(Screen.Onboarding.route) {
                popUpTo(Screen.Splash.route) { inclusive = true }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(SaffronPrimary, SaffronDark)
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .background(Color.White.copy(alpha = 0.2f), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MenuBook,
                    contentDescription = "Hari Pathshala Logo",
                    tint = Color.White,
                    modifier = Modifier.size(72.dp)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "HARI PATHSHALA",
                style = MaterialTheme.typography.displayLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 2.sp
                )
            )
            Text(
                text = "Your Divine Gateway to Vedic Knowledge",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Color.White.copy(alpha = 0.8f)
                ),
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}

// --- 2. ONBOARDING SCREEN ---
@Composable
fun OnboardingScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    var step by remember { mutableStateOf(1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.weight(1f))

        Crossfade(targetState = step) { currentStep ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .background(SaffronPrimary.copy(alpha = 0.1f), shape = RoundedCornerShape(32.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when (currentStep) {
                            1 -> Icons.Default.MenuBook
                            2 -> Icons.Default.Face
                            else -> Icons.Default.Star
                        },
                        contentDescription = "Intro",
                        tint = SaffronPrimary,
                        modifier = Modifier.size(80.dp)
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                Text(
                    text = when (currentStep) {
                        1 -> "Read Sacred Scriptures"
                        2 -> "Interact with AI Guru"
                        else -> "Gamified Quiz & Rewards"
                    },
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    ),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = when (currentStep) {
                        1 -> "Dive into flawless Bhagavad Gita, Upanishads, and Ramayana recitations with comprehensive commentaries."
                        2 -> "Get instant, context-aware spiritual guidance based purely on rich Vedic literature from your custom AI Guru."
                        else -> "Test your learnings, complete challenges, earn XP and level up your spiritual journey daily."
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = { navController.navigate(Screen.Auth.route) }
            ) {
                Text("Skip", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
            }

            Row {
                repeat(3) { index ->
                    Box(
                        modifier = Modifier
                            .padding(4.dp)
                            .size(if (step == index + 1) 12.dp else 8.dp)
                            .background(
                                color = if (step == index + 1) SaffronPrimary else MaterialTheme.colorScheme.onBackground.copy(
                                    alpha = 0.2f
                                ),
                                shape = CircleShape
                            )
                    )
                }
            }

            Button(
                onClick = {
                    if (step < 3) step++
                    else navController.navigate(Screen.Auth.route)
                },
                colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
            ) {
                Text("Next", color = Color.White)
            }
        }
    }
}

// --- 3. AUTH SCREEN ---
@Composable
fun AuthScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    var email by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    val loading by viewModel.authLoading.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(
                imageVector = Icons.Default.MenuBook,
                contentDescription = "Spiritual Logo",
                tint = SaffronPrimary,
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Begin Your Spiritual Journey",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                textAlign = TextAlign.Center
            )

            Text(
                text = "Sign in to access scriptures, track progress, and earn divine rewards.",
                style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp, bottom = 32.dp)
            )

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = "Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = SaffronPrimary,
                    focusedLabelColor = SaffronPrimary
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                leadingIcon = { Icon(Icons.Default.Email, contentDescription = "Email") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = SaffronPrimary,
                    focusedLabelColor = SaffronPrimary
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            if (loading) {
                CircularProgressIndicator(color = SaffronPrimary)
            } else {
                Button(
                    onClick = {
                        viewModel.login(email, name)
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Auth.route) { inclusive = true }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Access Pathshala", style = MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp, color = Color.White))
                }
            }
        }
    }
}

// --- 4. HOME SCREEN ---
@Composable
fun HomeScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val panchangData by viewModel.panchangData.collectAsState()
    val dohas by viewModel.dohas.collectAsState()
    val quotes by viewModel.quotes.collectAsState()

    // Fetch initial Panchang
    LaunchedEffect(true) {
        viewModel.fetchPanchang()
    }

    Scaffold(
        bottomBar = { SimpleBottomNavBar(navController, Screen.Home.route) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
        ) {
            // Hero Welcome Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(SaffronPrimary, SaffronDark)
                        ),
                        shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)
                    )
                    .padding(24.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Hari Om,",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.White.copy(alpha = 0.8f))
                            )
                            Text(
                                text = currentUser?.name ?: "Spiritual Seeker",
                                style = MaterialTheme.typography.headlineMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                        }

                        IconButton(
                            onClick = { navController.navigate(Screen.QuizDashboard.route) },
                            modifier = Modifier.background(Color.White.copy(alpha = 0.2f), shape = CircleShape)
                        ) {
                            Icon(Icons.Default.EmojiEvents, contentDescription = "Quiz Hub", tint = GoldAccent)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Daily Streak Counter
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.15f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Whatshot, contentDescription = "Streak", tint = GoldAccent, modifier = Modifier.size(28.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("4-Day Devotion Streak!", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            Text("120 XP", color = GoldAccent, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {

                // Daily Scripture Quote Card
                Text(
                    text = "Daily Gita Wisdom",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(bottom = 8.dp, top = 8.dp)
                )

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = quotes.firstOrNull()?.text ?: "\"Set thy heart upon thy work, but never on its reward.\"",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            color = SaffronDark
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "- Lord Krishna (Bhagavad Gita)",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.align(Alignment.End)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Interactive Quick Actions Grid
                Text(
                    text = "Explore Pathshala",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { navController.navigate(Screen.ScriptureList.route) },
                        colors = CardDefaults.cardColors(containerColor = SaffronPrimary.copy(alpha = 0.1f))
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.Book, contentDescription = "Read", tint = SaffronPrimary, modifier = Modifier.size(32.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Read Scriptures", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), textAlign = TextAlign.Center)
                        }
                    }

                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { navController.navigate(Screen.Panchang.route) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.AccessTime, contentDescription = "Panchang", tint = SaffronPrimary, modifier = Modifier.size(32.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Today Panchang", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), textAlign = TextAlign.Center)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Panchang Fast Access Banner
                panchangData?.let { panchang ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { navController.navigate(Screen.Panchang.route) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Panchang Summary", style = MaterialTheme.typography.bodyMedium.copy(color = SaffronPrimary, fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Tithi: ${panchang.tithi}", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                Text("Sunrise: ${panchang.sunRise} | Sunset: ${panchang.sunSet}", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp))
                            }
                            Icon(Icons.Default.KeyboardArrowRight, contentDescription = "Details", tint = SaffronPrimary)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Doha Slider Card
                Text(
                    text = "Kabir Ke Dohe",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        val firstDoha = dohas.firstOrNull()
                        Text(
                            text = firstDoha?.text ?: "कबीर खड़ा बज़ार में, मांगे सबकी खैर।\nना काहू से दोस्ती, ना काहू से बैर॥",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = firstDoha?.translation ?: "Kabir stands in the market place, wishing well for all.",
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

// --- 5. SCRIPTURE LIST SCREEN ---
@Composable
fun ScriptureListScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val categories by viewModel.categories.collectAsState()

    Scaffold(
        topBar = { MainHeader("Sacred Scriptures", onBackClick = { navController.popBackStack() }) },
        bottomBar = { SimpleBottomNavBar(navController, Screen.ScriptureList.route) }
    ) { innerPadding ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(1),
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(categories) { category ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { navController.navigate(Screen.ScriptureReader.createRoute(category.id)) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .background(SaffronPrimary, shape = RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Book, contentDescription = category.name, tint = Color.White, modifier = Modifier.size(32.dp))
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(category.name, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                            Text(category.description, style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)))
                        }

                        Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = SaffronPrimary)
                    }
                }
            }
        }
    }
}

// --- 6. SCRIPTURE READER SCREEN ---
@Composable
fun ScriptureReaderScreen(categoryId: String, navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val verses by viewModel.activeVerses.collectAsState()
    val aiCommentary by viewModel.aiCommentary.collectAsState()
    val loading by viewModel.readerLoading.collectAsState()

    var selectedChapter by remember { mutableStateOf(1) }
    var expandedCommentaryIndex by remember { mutableStateOf(-1) }

    LaunchedEffect(categoryId, selectedChapter) {
        viewModel.loadVerses(categoryId, selectedChapter)
    }

    Scaffold(
        topBar = { MainHeader("Scripture Reader", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Chapter Selector Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                repeat(18) { index ->
                    val chapNum = index + 1
                    FilterChip(
                        selected = selectedChapter == chapNum,
                        onClick = { selectedChapter = chapNum },
                        label = { Text("Chapter $chapNum") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = SaffronPrimary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            if (loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = SaffronPrimary)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(verses) { verse ->
                        val isCommentaryVisible = expandedCommentaryIndex == verse.verseNumber

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Verse ${verse.verseNumber}",
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = SaffronPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = verse.text,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    ),
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = verse.transliteration,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = verse.translation,
                                    style = MaterialTheme.typography.bodyLarge,
                                    lineHeight = 22.sp
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Button(
                                        onClick = {
                                            viewModel.requestAiCommentary(categoryId, selectedChapter, verse.verseNumber, verse.text, verse.translation)
                                            expandedCommentaryIndex = if (isCommentaryVisible) -1 else verse.verseNumber
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary.copy(alpha = 0.15f))
                                    ) {
                                        Icon(Icons.Default.AutoAwesome, contentDescription = "AI", tint = SaffronPrimary, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("AI Commentary", color = SaffronPrimary)
                                    }

                                    IconButton(
                                        onClick = { /* Handle share */ },
                                        modifier = Modifier.background(MaterialTheme.colorScheme.background, shape = CircleShape)
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = "Share", tint = SaffronPrimary)
                                    }
                                }

                                AnimatedVisibility(visible = isCommentaryVisible) {
                                    aiCommentary?.let { comm ->
                                        Column(
                                            modifier = Modifier
                                                .padding(top = 16.dp)
                                                .background(
                                                    MaterialTheme.colorScheme.primaryContainer,
                                                    shape = RoundedCornerShape(8.dp)
                                                )
                                                .padding(12.dp)
                                        ) {
                                            Text(
                                                "Spiritual Analysis",
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SaffronPrimary)
                                            )
                                            Text(comm.analysis, style = MaterialTheme.typography.bodyMedium)
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(
                                                "Practical Application",
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SaffronPrimary)
                                            )
                                            Text(comm.practicalApplication, style = MaterialTheme.typography.bodyMedium)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- 7. AI GURU SCREEN ---
@Composable
fun AIGuruScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val messages by viewModel.activeChatMessages.collectAsState()
    val loading by viewModel.chatLoading.collectAsState()
    var prompt by remember { mutableStateOf("") }

    Scaffold(
        topBar = { MainHeader("AI Guru Chat", onBackClick = { navController.popBackStack() }) },
        bottomBar = { SimpleBottomNavBar(navController, Screen.AiGuru.route) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (messages.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .background(SaffronPrimary.copy(alpha = 0.1f), shape = CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.AutoAwesome, contentDescription = "Guru AI", tint = SaffronPrimary, modifier = Modifier.size(36.dp))
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    "Pranam. I am your AI Guru.",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    "Ask me anything about Dharma, scriptures, life, or seeking salvation. I speak from sacred ancient books.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }
                    }
                } else {
                    items(messages) { message ->
                        val isUser = message.role == "user"
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                        ) {
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isUser) SaffronPrimary else MaterialTheme.colorScheme.surface
                                ),
                                shape = RoundedCornerShape(
                                    topStart = 16.dp,
                                    topEnd = 16.dp,
                                    bottomStart = if (isUser) 16.dp else 0.dp,
                                    bottomEnd = if (isUser) 0.dp else 16.dp
                                ),
                                modifier = Modifier.widthIn(max = 280.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = message.content,
                                        color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurface,
                                        style = MaterialTheme.typography.bodyLarge
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (loading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = SaffronPrimary)
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = prompt,
                    onValueChange = { prompt = it },
                    placeholder = { Text("Ask your Guru...") },
                    modifier = Modifier.weight(1f),
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = SaffronPrimary
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        viewModel.sendGuruMessage(prompt)
                        prompt = ""
                    },
                    modifier = Modifier.background(SaffronPrimary, shape = CircleShape)
                ) {
                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.White)
                }
            }
        }
    }
}

// --- 8. PANCHANG SCREEN ---
@Composable
fun PanchangScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val panchangData by viewModel.panchangData.collectAsState()
    val loading by viewModel.panchangLoading.collectAsState()

    LaunchedEffect(true) {
        viewModel.fetchPanchang()
    }

    Scaffold(
        topBar = { MainHeader("Today's Panchang", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            if (loading) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = SaffronPrimary)
                }
            } else {
                panchangData?.let { data ->
                    // Main Sunrise & Moonrise Solar Banner
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = SaffronPrimary.copy(alpha = 0.15f))
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("ASTROLOGICAL COORDINATES", style = MaterialTheme.typography.labelLarge, color = SaffronDark)
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.LightMode, contentDescription = "Sunrise", tint = SaffronPrimary, modifier = Modifier.size(36.dp))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Sunrise", style = MaterialTheme.typography.bodyMedium)
                                    Text(data.sunRise, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.DarkMode, contentDescription = "Sunset", tint = SaffronDark, modifier = Modifier.size(36.dp))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Sunset", style = MaterialTheme.typography.bodyMedium)
                                    Text(data.sunSet, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Panchang Parameter Checklist Table
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Spiritual Calendar Parameters", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), modifier = Modifier.padding(bottom = 12.dp))

                            listOf(
                                "Tithi" to data.tithi,
                                "Nakshatra" to data.nakshatra,
                                "Yoga" to data.yoga,
                                "Karana" to data.karana,
                                "Abhijit Muhurta" to data.abhijitMuhurta,
                                "Rahu Kaal" to data.rahuKaal
                            ).forEach { (label, value) ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(label, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    Text(value.ifBlank { "N/A" }, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                }
                                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- 9. STORE SCREEN ---
@Composable
fun StoreScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val products by viewModel.products.collectAsState()
    val wishlist by viewModel.wishlist.collectAsState()

    Scaffold(
        topBar = {
            MainHeader("Pristine Store", actions = {
                IconButton(onClick = { navController.navigate(Screen.Cart.route) }) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = "Cart", tint = SaffronPrimary)
                }
            })
        },
        bottomBar = { SimpleBottomNavBar(navController, Screen.Store.route) }
    ) { innerPadding ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(products) { product ->
                val isInWish = wishlist.any { it.id == product.id }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { navController.navigate(Screen.ProductDetail.createRoute(product.id)) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Column {
                            // Product Image Placeholder
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(130.dp)
                                    .background(SaffronPrimary.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MenuBook, contentDescription = product.title, tint = SaffronPrimary, modifier = Modifier.size(48.dp))
                            }

                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = product.title,
                                    style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "₹${product.price}",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold, color = SaffronPrimary),
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = { viewModel.toggleWishlist(product) },
                            modifier = Modifier.align(Alignment.TopEnd)
                        ) {
                            Icon(
                                imageVector = if (isInWish) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                                contentDescription = "Wish",
                                tint = if (isInWish) Color.Red else Color.Gray
                            )
                        }
                    }
                }
            }
        }
    }
}

// --- 10. PRODUCT DETAIL SCREEN ---
@Composable
fun ProductDetailScreen(productId: String, navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val products by viewModel.products.collectAsState()
    val product = products.find { it.id == productId }

    Scaffold(
        topBar = { MainHeader("Product Details", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        product?.let { prod ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background)
                    .verticalScroll(rememberScrollState())
            ) {
                // Large Image Stage
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp)
                        .background(SaffronPrimary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = prod.title, tint = SaffronPrimary, modifier = Modifier.size(96.dp))
                }

                Column(modifier = Modifier.padding(24.dp)) {
                    Text(prod.title, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("₹${prod.price}", style = MaterialTheme.typography.headlineMedium.copy(color = SaffronPrimary, fontWeight = FontWeight.Bold))
                        Card(colors = CardDefaults.cardColors(containerColor = GoldAccent.copy(alpha = 0.2f))) {
                            Text("⭐ ${prod.averageRating} Rating", modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                    Text("Description", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(prod.description, style = MaterialTheme.typography.bodyLarge, lineHeight = 24.sp)

                    Spacer(modifier = Modifier.height(40.dp))

                    Button(
                        onClick = { viewModel.addToCart(prod) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Add to Cart", style = MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp, color = Color.White))
                    }
                }
            }
        }
    }
}

// --- 11. CART SCREEN ---
@Composable
fun CartScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val cart by viewModel.cart.collectAsState()
    val subtotal = cart.sumOf { it.product.price * it.quantity }

    Scaffold(
        topBar = { MainHeader("Shopping Cart", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (cart.isEmpty()) {
                Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Empty", tint = Color.LightGray, modifier = Modifier.size(120.dp))
                        Text("Your spiritual cart is empty", style = MaterialTheme.typography.titleLarge.copy(color = Color.Gray))
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(cart) { item ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(60.dp)
                                        .background(SaffronPrimary.copy(alpha = 0.1f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.MenuBook, contentDescription = item.product.title, tint = SaffronPrimary)
                                }

                                Spacer(modifier = Modifier.width(16.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.product.title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                    Text("₹${item.product.price}", style = MaterialTheme.typography.bodyMedium.copy(color = SaffronPrimary))
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(onClick = { viewModel.updateCartQuantity(item.product.id, -1) }) {
                                        Icon(Icons.Default.Remove, contentDescription = "Less")
                                    }
                                    Text("${item.quantity}", fontWeight = FontWeight.Bold)
                                    IconButton(onClick = { viewModel.updateCartQuantity(item.product.id, 1) }) {
                                        Icon(Icons.Default.Add, contentDescription = "More")
                                    }
                                }
                            }
                        }
                    }
                }

                // Summary CTA Section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Subtotal", style = MaterialTheme.typography.bodyLarge)
                            Text("₹$subtotal", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { navController.navigate(Screen.Checkout.route) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                        ) {
                            Text("Proceed to Checkout", color = Color.White)
                        }
                    }
                }
            }
        }
    }
}

// --- 12. CHECKOUT SCREEN ---
@Composable
fun CheckoutScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val loading by viewModel.checkoutLoading.collectAsState()
    val addresses by viewModel.addresses.collectAsState()
    val cart by viewModel.cart.collectAsState()
    val total = cart.sumOf { it.product.price * it.quantity }

    var selectedAddress by remember { mutableStateOf(addresses.firstOrNull() ?: ShippingAddress()) }
    var selectedPaymentMethod by remember { mutableStateOf("razorpay") }

    Scaffold(
        topBar = { MainHeader("Checkout details", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            Text("Shipping Address", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedAddress.name,
                onValueChange = { selectedAddress = selectedAddress.copy(name = it) },
                label = { Text("Full Name") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedAddress.line1,
                onValueChange = { selectedAddress = selectedAddress.copy(line1 = it) },
                label = { Text("Flat/Street Address") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedAddress.city,
                onValueChange = { selectedAddress = selectedAddress.copy(city = it) },
                label = { Text("City") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedAddress.pincode,
                onValueChange = { selectedAddress = selectedAddress.copy(pincode = it) },
                label = { Text("Pincode") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text("Payment Method", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = selectedPaymentMethod == "razorpay", onClick = { selectedPaymentMethod = "razorpay" })
                Text("Razorpay Online Card / UPI", style = MaterialTheme.typography.bodyLarge)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = selectedPaymentMethod == "cod", onClick = { selectedPaymentMethod = "cod" })
                Text("Cash on Delivery (COD)", style = MaterialTheme.typography.bodyLarge)
            }

            Spacer(modifier = Modifier.height(32.dp))

            if (loading) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = SaffronPrimary)
                }
            } else {
                Button(
                    onClick = {
                        viewModel.submitCheckoutOrder(selectedAddress, selectedPaymentMethod)
                        navController.navigate(Screen.OrderSuccess.route)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                ) {
                    Text("Place Order - ₹$total", color = Color.White)
                }
            }
        }
    }
}

// --- 13. ORDER SUCCESS SCREEN ---
@Composable
fun OrderSuccessScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color(0xFF4CAF50), shape = CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Check, contentDescription = "Success", tint = Color.White, modifier = Modifier.size(56.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Order Placed Successfully!", style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold))
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Your sacred books/products will be shipped soon. Thank you for supporting the pathway.",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(40.dp))

            Button(
                onClick = { navController.navigate(Screen.Home.route) },
                colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
            ) {
                Text("Return Home", color = Color.White)
            }
        }
    }
}

// --- 14. QUIZ DASHBOARD SCREEN ---
@Composable
fun QuizDashboardScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val chapters by viewModel.chapters.collectAsState()
    val stats by viewModel.userStats.collectAsState()

    Scaffold(
        topBar = { MainHeader("Vedic Quiz Hub", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Level / XP Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SaffronPrimary.copy(alpha = 0.15f))
            ) {
                Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(SaffronPrimary, shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Lvl 2", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("Spiritual Knowledge XP", style = MaterialTheme.typography.bodyMedium)
                        Text("${stats.xp} Total XP Accumulated", style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold, color = SaffronDark))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Select Chapter to Play", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            Spacer(modifier = Modifier.height(12.dp))

            chapters.forEach { chapter ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                        .clickable { navController.navigate(Screen.QuizPlay.createRoute("gita", chapter.id)) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(SaffronPrimary, shape = RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${chapter.order}", color = Color.White, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(chapter.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                            Text("${chapter.questionsCount} Questions available", style = MaterialTheme.typography.bodyMedium.copy(color = Color.Gray))
                        }

                        Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = SaffronPrimary)
                    }
                }
            }
        }
    }
}

// --- 15. QUIZ PLAY SCREEN ---
@Composable
fun QuizPlayScreen(subjectId: String, chapterId: String, navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val questions by viewModel.quizQuestions.collectAsState()
    val loading by viewModel.quizLoading.collectAsState()

    var activeIndex by remember { mutableStateOf(0) }
    var selectedOptionIndex by remember { mutableStateOf(-1) }
    var isSubmitted by remember { mutableStateOf(false) }
    var score by remember { mutableStateOf(0) }

    LaunchedEffect(subjectId, chapterId) {
        viewModel.startQuizSession(subjectId, chapterId)
    }

    Scaffold(
        topBar = { MainHeader("Spiritual Quiz Challenge", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp)
        ) {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = SaffronPrimary)
            } else if (questions.isNotEmpty() && activeIndex < questions.size) {
                val q = questions[activeIndex]

                Column(modifier = Modifier.fillMaxSize()) {
                    // Question progress indicators
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Question ${activeIndex + 1}/${questions.size}", fontWeight = FontWeight.Bold)
                        Text("Score: $score", color = SaffronPrimary, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(16.dp))

                    Text(q.question, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(24.dp))

                    q.options.forEachIndexed { optIndex, option ->
                        val isSelected = selectedOptionIndex == optIndex
                        val cardColor = if (isSubmitted) {
                            if (optIndex == q.correctAnswerIndex) Color(0xFFE8F5E9)
                            else if (isSelected) Color(0xFFFFEBEE)
                            else MaterialTheme.colorScheme.surface
                        } else {
                            if (isSelected) SaffronPrimary.copy(alpha = 0.15f)
                            else MaterialTheme.colorScheme.surface
                        }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                                .clickable { if (!isSubmitted) selectedOptionIndex = optIndex },
                            colors = CardDefaults.cardColors(containerColor = cardColor),
                            border = BorderStroke(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) SaffronPrimary else Color.LightGray.copy(alpha = 0.3f)
                            )
                        ) {
                            Text(option, modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.bodyLarge)
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    if (isSubmitted) {
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F8E9))) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Explanation", fontWeight = FontWeight.Bold, color = Color(0xFF33691E))
                                Text(q.explanation)
                            }
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        Button(
                            onClick = {
                                if (activeIndex + 1 < questions.size) {
                                    activeIndex++
                                    selectedOptionIndex = -1
                                    isSubmitted = false
                                } else {
                                    viewModel.submitQuizResults(score, questions.size)
                                    activeIndex++ // Trigger completion
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                        ) {
                            Text("Next Question", color = Color.White)
                        }
                    } else {
                        Spacer(modifier = Modifier.weight(1f))

                        Button(
                            onClick = {
                                if (selectedOptionIndex != -1) {
                                    isSubmitted = true
                                    if (selectedOptionIndex == q.correctAnswerIndex) {
                                        score++
                                    }
                                }
                            },
                            enabled = selectedOptionIndex != -1,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                        ) {
                            Text("Submit Answer", color = Color.White)
                        }
                    }
                }
            } else if (questions.isNotEmpty() && activeIndex >= questions.size) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(100.dp)
                            .background(SaffronPrimary, shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Star, contentDescription = "Success", tint = Color.White, modifier = Modifier.size(56.dp))
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text("Challenge Completed!", style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Your Score: $score/${questions.size}", style = MaterialTheme.typography.titleLarge)
                    Text("You earned +${score * 20} XP on your devotion pathway!", color = SaffronPrimary, fontWeight = FontWeight.Bold)

                    Spacer(modifier = Modifier.height(40.dp))

                    Button(
                        onClick = { navController.navigate(Screen.Home.route) },
                        colors = ButtonDefaults.buttonColors(containerColor = SaffronPrimary)
                    ) {
                        Text("Return to Hub", color = Color.White)
                    }
                }
            }
        }
    }
}

// --- 16. LEADERBOARD SCREEN ---
@Composable
fun LeaderboardScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    Scaffold(
        topBar = { MainHeader("Daily Seeker Leaderboard", onBackClick = { navController.popBackStack() }) }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(
                listOf(
                    QuizLeaderboardEntry("1", "Achyut Dasa", "", 1200, 15, 1),
                    QuizLeaderboardEntry("2", "Swami Govind", "", 980, 12, 2),
                    QuizLeaderboardEntry("3", "Meera Devi", "", 820, 10, 3),
                    QuizLeaderboardEntry("4", "Keshav Jha", "", 650, 7, 4)
                )
            ) { seeker ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(
                                        color = when (seeker.rank) {
                                            1 -> GoldAccent
                                            2 -> Color.LightGray
                                            else -> SaffronPrimary.copy(alpha = 0.2f)
                                        },
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("#${seeker.rank}", fontWeight = FontWeight.Bold)
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            Column {
                                Text(seeker.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                                Text("${seeker.streak} Days Streak", style = MaterialTheme.typography.bodyMedium.copy(color = Color.Gray))
                            }
                        }

                        Text("${seeker.xp} XP", style = MaterialTheme.typography.titleLarge.copy(color = SaffronPrimary, fontWeight = FontWeight.Bold))
                    }
                }
            }
        }
    }
}

// --- 17. PROFILE SCREEN ---
@Composable
fun ProfileScreen(navController: NavHostController, viewModel: HariPathshalaViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val stats by viewModel.userStats.collectAsState()

    Scaffold(
        topBar = { MainHeader("My Profile", actions = {
            IconButton(onClick = {
                viewModel.logout()
                navController.navigate(Screen.Auth.route) {
                    popUpTo(Screen.Home.route) { inclusive = true }
                }
            }) {
                Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = SaffronPrimary)
            }
        }),
        bottomBar = { SimpleBottomNavBar(navController, Screen.Profile.route) }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .background(SaffronPrimary.copy(alpha = 0.15f), shape = CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Person, contentDescription = "Profile", tint = SaffronPrimary, modifier = Modifier.size(48.dp))
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = currentUser?.name ?: "Spiritual Seeker",
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = currentUser?.email ?: "seeker@haripathshala.com",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Lifetime Achievements", style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("${stats.quizzesCompleted}", style = MaterialTheme.typography.headlineMedium.copy(color = SaffronPrimary, fontWeight = FontWeight.Bold))
                        Text("Quizzes Cleared", style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("${stats.streak} Days", style = MaterialTheme.typography.headlineMedium.copy(color = SaffronPrimary, fontWeight = FontWeight.Bold))
                        Text("Current Streak", style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Option Settings list
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column {
                    listOf(
                        "My Reading History" to Icons.Default.History,
                        "Saved Bookmarks" to Icons.Default.BookmarkBorder,
                        "Notification Settings" to Icons.Default.NotificationsNone
                    ).forEach { (setting, icon) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(icon, contentDescription = setting, tint = SaffronPrimary)
                            Spacer(modifier = Modifier.width(16.dp))
                            Text(setting, style = MaterialTheme.typography.bodyLarge)
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(Icons.Default.ChevronRight, contentDescription = "Open", tint = Color.Gray)
                        }
                        Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                    }
                }
            }
        }
    }
}

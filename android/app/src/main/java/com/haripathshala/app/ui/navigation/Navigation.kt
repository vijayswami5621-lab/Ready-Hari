package com.haripathshala.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.haripathshala.app.ui.screens.*
import com.haripathshala.app.viewmodel.HariPathshalaViewModel

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Onboarding : Screen("onboarding")
    object Auth : Screen("auth")
    object Home : Screen("home")
    object ScriptureList : Screen("scriptures")
    object ScriptureReader : Screen("scripture_reader/{categoryId}") {
        fun createRoute(categoryId: String) = "scripture_reader/$categoryId"
    }
    object AiGuru : Screen("aiguru")
    object Panchang : Screen("panchang")
    object Store : Screen("store")
    object ProductDetail : Screen("product_detail/{productId}") {
        fun createRoute(productId: String) = "product_detail/$productId"
    }
    object Cart : Screen("cart")
    object Checkout : Screen("checkout")
    object OrderSuccess : Screen("order_success")
    object QuizDashboard : Screen("quiz_dashboard")
    object QuizPlay : Screen("quiz_play/{subjectId}/{chapterId}") {
        fun createRoute(subjectId: String, chapterId: String) = "quiz_play/$subjectId/$chapterId"
    }
    object Leaderboard : Screen("leaderboard")
    object Profile : Screen("profile")
}

@Composable
fun HariPathshalaNavHost(
    navController: NavHostController,
    viewModel: HariPathshalaViewModel
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Onboarding.route) {
            OnboardingScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Auth.route) {
            AuthScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Home.route) {
            HomeScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.ScriptureList.route) {
            ScriptureListScreen(navController = navController, viewModel = viewModel)
        }

        composable(
            route = Screen.ScriptureReader.route,
            arguments = listOf(navArgument("categoryId") { type = NavType.StringType })
        ) { backStackEntry ->
            val catId = backStackEntry.arguments?.getString("categoryId") ?: "bg"
            ScriptureReaderScreen(categoryId = catId, navController = navController, viewModel = viewModel)
        }

        composable(Screen.AiGuru.route) {
            AIGuruScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Panchang.route) {
            PanchangScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Store.route) {
            StoreScreen(navController = navController, viewModel = viewModel)
        }

        composable(
            route = Screen.ProductDetail.route,
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) { backStackEntry ->
            val pId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(productId = pId, navController = navController, viewModel = viewModel)
        }

        composable(Screen.Cart.route) {
            CartScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Checkout.route) {
            CheckoutScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.OrderSuccess.route) {
            OrderSuccessScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.QuizDashboard.route) {
            QuizDashboardScreen(navController = navController, viewModel = viewModel)
        }

        composable(
            route = Screen.QuizPlay.route,
            arguments = listOf(
                navArgument("subjectId") { type = NavType.StringType },
                navArgument("chapterId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val sId = backStackEntry.arguments?.getString("subjectId") ?: ""
            val cId = backStackEntry.arguments?.getString("chapterId") ?: ""
            QuizPlayScreen(subjectId = sId, chapterId = cId, navController = navController, viewModel = viewModel)
        }

        composable(Screen.Leaderboard.route) {
            LeaderboardScreen(navController = navController, viewModel = viewModel)
        }

        composable(Screen.Profile.route) {
            ProfileScreen(navController = navController, viewModel = viewModel)
        }
    }
}
